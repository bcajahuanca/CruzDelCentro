#!/usr/bin/env python3

import argparse
import os
import re
import sys
from datetime import datetime

from python_calamine import CalamineWorkbook
import psycopg


SHEET_NAME = "TRANSPORTES CRUZ DEL CENTRO S.A"

# Columnas del Excel que usaremos directamente.
COL_PAD = "PAD"
COL_PLACA = "PLACA"
COL_MARCA = "MARCA"
COL_MODELO = "MODELO"
COL_CARROCERIA = "CARROCERIA"
COL_ANIO = "AÑO FAB."
COL_ESTADO = "ESTADO"

# Columnas que la tabla unidad todavía no tiene.
# Para no perder la información, se guardan temporalmente en observaciones.
EXTRA_COLUMNS = [
    "CATEGORIA",
    "COMBUSTIBLE",
    "PROPIETARIO",
    "CONCESIONARIO",
    "RUTA",
    "F.CREACIÓN",
    "Altura Unidad",
    "Ancho Unidad",
    "Longitud Unidad",
    "Carga Util",
    "Clase",
    "Color Unidad",
    "Combustible",
    "Nro Asientos",
    "Nro Ejes",
    "Nro Pasajeros",
    "Cilindros",
]


def texto(valor):
    """Convierte una celda a texto limpio."""
    if valor is None:
        return None

    value = str(valor).strip()
    value = re.sub(r"\s+", " ", value)

    if value == "":
        return None

    return value


def normalizar_pad(valor):
    """
    PAD:
      1   -> 001
      14  -> 014
      118 -> 118

    Si en Excel llega como 14.0 también se acepta.
    """
    if valor is None:
        raise ValueError("PAD vacío")

    if isinstance(valor, float):
        if not valor.is_integer():
            raise ValueError(f"PAD no entero: {valor}")
        numero = int(valor)
    elif isinstance(valor, int):
        numero = valor
    else:
        limpio = str(valor).strip()

        # Acepta textos tipo "14.0".
        if re.fullmatch(r"\d+\.0+", limpio):
            limpio = limpio.split(".")[0]

        if not limpio.isdigit():
            raise ValueError(f"PAD inválido: {valor}")

        numero = int(limpio)

    if numero < 0:
        raise ValueError(f"PAD inválido: {valor}")

    return str(numero).zfill(3)


def normalizar_placa(valor):
    value = texto(valor)

    if not value:
        raise ValueError("Placa vacía")

    return value.upper()


def normalizar_marca(valor):
    value = texto(valor)

    if not value:
        raise ValueError("Marca vacía")

    # Canonización de las marcas existentes en este Excel.
    marcas = {
        "mercedes benz": "Mercedes Benz",
        "volvo": "Volvo",
        "yutong": "Yutong",
        "volkswagen": "Volkswagen",
        "king long": "King Long",
    }

    return marcas.get(value.casefold(), value)


def normalizar_modelo(valor):
    value = texto(valor)

    if not value:
        raise ValueError("Modelo vacío")

    value = value.upper()

    # El Excel contiene, por ejemplo:
    # OF 1721/59, OF.1721/59 y OF-1721/59.
    # Los tres quedan como OF-1721/59.
    match = re.fullmatch(r"OF[\s.\-]*(\d+/\d+)", value)

    if match:
        return f"OF-{match.group(1)}"

    return re.sub(r"\s+", " ", value)


def normalizar_carroceria(valor):
    value = texto(valor)

    if not value:
        return "BUS"

    return value.upper()[:50]


def normalizar_anio(valor):
    if valor is None or texto(valor) is None:
        return None

    try:
        anio = int(float(valor))
    except (ValueError, TypeError):
        raise ValueError(f"Año inválido: {valor}")

    if not 1900 <= anio <= 2200:
        raise ValueError(f"Año fuera de rango: {anio}")

    return anio


def normalizar_estado(valor):
    value = (texto(valor) or "").casefold()

    if value in {"activo", "activa", "operativa", "operativo"}:
        return "OPERATIVA", True

    if value in {
        "mantenimiento",
        "en mantenimiento",
        "en_mantenimiento",
    }:
        return "EN_MANTENIMIENTO", True

    if value in {
        "inactivo",
        "inactiva",
        "fuera de servicio",
        "fuera_servicio",
        "baja",
    }:
        return "FUERA_SERVICIO", False

    raise ValueError(f"Estado no reconocido: {valor}")


def valor_observacion(valor):
    if valor is None:
        return None

    # Calamine puede entregar fechas como datetime.
    if isinstance(valor, datetime):
        return valor.isoformat(sep=" ", timespec="seconds")

    return texto(valor)


def construir_observaciones(fila):
    lineas = []

    for columna in EXTRA_COLUMNS:
        valor = valor_observacion(fila.get(columna))

        if valor is not None:
            lineas.append(f"{columna}: {valor}")

    if not lineas:
        return None

    return "Datos importados del padrón Excel:\n" + "\n".join(lineas)


def cargar_excel(path):
    wb = CalamineWorkbook.from_path(path)

    try:
        sheet = wb.get_sheet_by_name(SHEET_NAME)
    except Exception as exc:
        raise RuntimeError(
            f"No se encontró la hoja '{SHEET_NAME}'."
        ) from exc

    rows = sheet.to_python()

    if not rows:
        raise RuntimeError("El Excel está vacío.")

    headers = [texto(x) for x in rows[0]]

    required = {
        COL_PAD,
        COL_PLACA,
        COL_MARCA,
        COL_MODELO,
        COL_CARROCERIA,
        COL_ANIO,
        COL_ESTADO,
    }

    missing = sorted(required - set(headers))

    if missing:
        raise RuntimeError(
            "Faltan columnas obligatorias: " + ", ".join(missing)
        )

    result = []

    for row_number, values in enumerate(rows[1:], start=2):
        # Ignora filas totalmente vacías.
        if not any(v is not None and texto(v) is not None for v in values):
            continue

        row = {
            headers[i]: values[i] if i < len(values) else None
            for i in range(len(headers))
            if headers[i] is not None
        }

        row["_excel_row"] = row_number
        result.append(row)

    return result


def preparar_unidad(fila):
    estado_operativo, activo = normalizar_estado(
        fila.get(COL_ESTADO)
    )

    return {
        "codigo": normalizar_pad(fila.get(COL_PAD)),
        "placa": normalizar_placa(fila.get(COL_PLACA)),
        "marca": normalizar_marca(fila.get(COL_MARCA)),
        "modelo": normalizar_modelo(fila.get(COL_MODELO)),
        "tipo_vehiculo": normalizar_carroceria(
            fila.get(COL_CARROCERIA)
        ),
        "anio_fabricacion": normalizar_anio(
            fila.get(COL_ANIO)
        ),
        "estado_operativo": estado_operativo,
        "activo": activo,
        "observaciones": construir_observaciones(fila),
    }


def obtener_o_crear_marca(cur, nombre):
    cur.execute(
        """
        SELECT id
        FROM marca
        WHERE LOWER(nombre) = LOWER(%s)
        LIMIT 1
        """,
        (nombre,),
    )

    row = cur.fetchone()

    if row:
        return row[0]

    cur.execute(
        """
        INSERT INTO marca(nombre)
        VALUES (%s)
        RETURNING id
        """,
        (nombre,),
    )

    return cur.fetchone()[0]


def obtener_o_crear_modelo(cur, marca_id, nombre):
    cur.execute(
        """
        SELECT id
        FROM modelo_vehiculo
        WHERE marca_id = %s
          AND LOWER(nombre) = LOWER(%s)
        LIMIT 1
        """,
        (marca_id, nombre),
    )

    row = cur.fetchone()

    if row:
        return row[0]

    cur.execute(
        """
        INSERT INTO modelo_vehiculo(marca_id, nombre)
        VALUES (%s, %s)
        RETURNING id
        """,
        (marca_id, nombre),
    )

    return cur.fetchone()[0]


def guardar_unidad(cur, unidad):
    marca_id = obtener_o_crear_marca(
        cur,
        unidad["marca"],
    )

    modelo_id = obtener_o_crear_modelo(
        cur,
        marca_id,
        unidad["modelo"],
    )

    # Primero verificamos si el PAD ya existe.
    cur.execute(
        """
        SELECT id
        FROM unidad
        WHERE codigo = %s
        """,
        (unidad["codigo"],),
    )

    existente = cur.fetchone()

    if existente:
        unidad_id = existente[0]

        # El script es re-ejecutable:
        # si el PAD ya existe, actualiza sus datos.
        cur.execute(
            """
            UPDATE unidad
            SET placa = %s,
                modelo_id = %s,
                tipo_vehiculo = %s,
                anio_fabricacion = %s,
                estado_operativo = %s,
                activo = %s,
                observaciones = %s,
                actualizado_en = utc_now()
            WHERE id = %s
            """,
            (
                unidad["placa"],
                modelo_id,
                unidad["tipo_vehiculo"],
                unidad["anio_fabricacion"],
                unidad["estado_operativo"],
                unidad["activo"],
                unidad["observaciones"],
                unidad_id,
            ),
        )

        return unidad_id, "actualizada"

    # Si la placa pertenece a otro PAD, no la reasignamos silenciosamente.
    cur.execute(
        """
        SELECT codigo
        FROM unidad
        WHERE placa = %s
        """,
        (unidad["placa"],),
    )

    placa_existente = cur.fetchone()

    if placa_existente:
        raise ValueError(
            f"La placa {unidad['placa']} ya pertenece "
            f"al PAD {placa_existente[0]}"
        )

    cur.execute(
        """
        INSERT INTO unidad(
            codigo,
            placa,
            modelo_id,
            tipo_vehiculo,
            anio_fabricacion,
            estado_operativo,
            activo,
            observaciones
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            unidad["codigo"],
            unidad["placa"],
            modelo_id,
            unidad["tipo_vehiculo"],
            unidad["anio_fabricacion"],
            unidad["estado_operativo"],
            unidad["activo"],
            unidad["observaciones"],
        ),
    )

    return cur.fetchone()[0], "insertada"


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Importa el padrón de buses de Cruz del Centro "
            "desde Excel hacia PostgreSQL."
        )
    )

    parser.add_argument(
        "excel",
        help="Ruta al archivo Buses_TransporteCruzDelCentro.xlsx",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "Valida y muestra los datos, pero NO escribe "
            "nada en PostgreSQL."
        ),
    )

    args = parser.parse_args()

    if not os.path.exists(args.excel):
        print(f"ERROR: no existe el archivo: {args.excel}")
        sys.exit(1)

    filas = cargar_excel(args.excel)

    print(f"Filas encontradas en Excel: {len(filas)}")

    preparadas = []
    errores_preparacion = []

    for fila in filas:
        try:
            preparadas.append(
                (
                    fila["_excel_row"],
                    preparar_unidad(fila),
                )
            )
        except Exception as exc:
            errores_preparacion.append(
                (fila["_excel_row"], str(exc))
            )

    print(f"Filas válidas: {len(preparadas)}")

    if errores_preparacion:
        print("\nERRORES DE VALIDACIÓN:")
        for numero, error in errores_preparacion:
            print(f"  Excel fila {numero}: {error}")

        print(
            "\nNo se importará nada hasta corregir "
            "los errores anteriores."
        )
        sys.exit(1)

    # Validaciones antes de tocar la BD.
    codigos = [u["codigo"] for _, u in preparadas]
    placas = [u["placa"] for _, u in preparadas]

    if len(codigos) != len(set(codigos)):
        print("ERROR: existen PAD duplicados después de normalizar.")
        sys.exit(1)

    if len(placas) != len(set(placas)):
        print("ERROR: existen placas duplicadas en el Excel.")
        sys.exit(1)

    print("\nPrimeras unidades normalizadas:")

    for _, u in preparadas[:5]:
        print(
            f"  PAD {u['codigo']} | "
            f"{u['placa']} | "
            f"{u['marca']} | "
            f"{u['modelo']} | "
            f"{u['anio_fabricacion']}"
        )

    if args.dry_run:
        print("\nDRY RUN completado. No se modificó la base de datos.")
        return

    conn_info = {
        "host": os.getenv("CDC_DB_HOST", "localhost"),
        "port": os.getenv("CDC_DB_PORT", "5432"),
        "dbname": os.getenv("CDC_DB_NAME", "cruz_del_centro"),
        "user": os.getenv("CDC_DB_USER", "bcatsmp"),
        "password": os.getenv("CDC_DB_PASSWORD", ""),
    }

    insertadas = 0
    actualizadas = 0
    errores_bd = []

    print(
        f"\nConectando a PostgreSQL: "
        f"{conn_info['host']}:{conn_info['port']}/"
        f"{conn_info['dbname']}"
    )

    with psycopg.connect(**conn_info) as conn:
        for numero_excel, unidad in preparadas:
            try:
                # Un savepoint/transacción por fila:
                # una fila defectuosa no borra las anteriores.
                with conn.transaction():
                    with conn.cursor() as cur:
                        _, accion = guardar_unidad(cur, unidad)

                if accion == "insertada":
                    insertadas += 1
                else:
                    actualizadas += 1

                print(
                    f"OK fila {numero_excel}: "
                    f"PAD {unidad['codigo']} "
                    f"{unidad['placa']} ({accion})"
                )

            except Exception as exc:
                errores_bd.append(
                    (
                        numero_excel,
                        unidad["codigo"],
                        unidad["placa"],
                        str(exc),
                    )
                )

                print(
                    f"ERROR fila {numero_excel}: "
                    f"PAD {unidad['codigo']} "
                    f"{unidad['placa']} -> {exc}"
                )

    print("\n" + "=" * 55)
    print("IMPORTACIÓN FINALIZADA")
    print("=" * 55)
    print(f"Procesadas   : {len(preparadas)}")
    print(f"Insertadas   : {insertadas}")
    print(f"Actualizadas : {actualizadas}")
    print(f"Errores      : {len(errores_bd)}")

    if errores_bd:
        print("\nFilas que debes revisar:")

        for fila, codigo, placa, error in errores_bd:
            print(
                f"  Fila {fila} | PAD {codigo} | "
                f"{placa} | {error}"
            )

        sys.exit(2)


if __name__ == "__main__":
    main()
