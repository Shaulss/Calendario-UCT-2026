from flask import Flask, render_template, jsonify
import pandas as pd
from datetime import datetime
import os

app = app = Flask(__name__, template_folder='templates', static_folder='static')

datos_calendario = []

def inicializar_datos():
    global datos_calendario
    archivo_excel = None
    for archivo in os.listdir('.'):
        if 'calendario' in archivo.lower() and archivo.endswith('.xlsx'):
            archivo_excel = archivo
            break
            
    if not archivo_excel:
        print("❌ CRÍTICO: No se encontró el archivo Excel (.xlsx) en la carpeta.")
        return False

    try:
        print(f"-> Leyendo archivo: {archivo_excel}...")
        df = pd.read_excel(archivo_excel, header=1, engine='openpyxl')
        df.columns = df.columns.str.strip()
        
        # Convertir a datetime de Pandas
        df['INICIO'] = pd.to_datetime(df['INICIO'], errors='coerce')
        df['TERMINO'] = pd.to_datetime(df['TERMINO'], errors='coerce')
        
        df['ACTIVIDAD'] = df['ACTIVIDAD'].fillna("Sin descripción")
        df['AGENTES'] = df['AGENTES'].fillna("Comunidad")
        
        # Fecha base para comparar el calendario académico
        fecha_hoy = pd.to_datetime(datetime.now().date())
        
        estados = []
        for idx, row in df.iterrows():
            inicio = row['INICIO']
            termino = row['TERMINO']
            
            if pd.isnull(inicio):
                estados.append("Pasado")
                continue
                
            if pd.isnull(termino):
                if inicio.date() < fecha_hoy.date(): estados.append("Pasado")
                elif inicio.date() == fecha_hoy.date(): estados.append("Vigente")
                else: estados.append("Próximo")
            else:
                if termino.date() < fecha_hoy.date(): estados.append("Pasado")
                elif inicio.date() <= fecha_hoy.date() <= termino.date(): estados.append("Vigente")
                else: estados.append("Próximo")
                
        df['Estado'] = estados
        
        # Convertir las fechas a texto legible antes de enviarlas al Navegador
        df['INICIO'] = df['INICIO'].dt.strftime('%d-%m-%Y').fillna("")
        df['TERMINO'] = df['TERMINO'].dt.strftime('%d-%m-%Y').fillna("")
        
        datos_calendario = df.to_dict(orient='records')
        print(f"✅ ¡{len(datos_calendario)} registros procesados y listos en memoria!")
        return True
    except Exception as e:
        print(f"❌ Error interno al procesar el Excel: {e}")
        return False

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/actividades')
def obtener_actividades():
    if not datos_calendario:
        return jsonify({"error": "No hay datos disponibles en el servidor"}), 500
    return jsonify(datos_calendario)

if __name__ == '__main__':
    if inicializar_datos():
        print("🚀 Servidor Flask corriendo en http://localhost:5000")
        app.run(debug=True, port=5000)