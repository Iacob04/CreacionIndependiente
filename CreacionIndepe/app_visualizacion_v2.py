import pandas as pd
import plotly.express as px
import streamlit as st
from datetime import datetime

# Configuración de página para que se vea profesional y ancha
st.set_page_config(page_title="Dashboard Creación Independiente", layout="wide")


@st.cache_data
def load_data():
    # Usamos el archivo Excel directamente como descubrimos antes
    archivo = 'datos_completos (2).xlsx'
    df_org = pd.read_excel(archivo, sheet_name='Organizaciones')
    df_prod = pd.read_excel(archivo, sheet_name='Producciones')
    return df_org, df_prod


try:
    df_org_raw, df_prod_raw = load_data()
    AÑO_ACTUAL = 2026

    # --- BARRA LATERAL DE FILTROS (Lo que faltaba) ---
    st.sidebar.title(" Filtros Globales")

    # Selector de Fichero
    menu = st.sidebar.radio("Seleccione Fichero:", [" Organizaciones (Compañías)", " Producciones (Espectáculos)"])

    st.sidebar.markdown("---")

    # Selector de Comunidad Autónoma (Filtro maestro)
    comunidades = ["Todas"] + sorted(df_org_raw['Comunidad autonoma'].dropna().unique().tolist())
    sel_comunidad = st.sidebar.selectbox("Filtrar por Comunidad Autónoma:", comunidades)

    # Aplicar el filtro a los datos antes de mostrar nada
    if sel_comunidad != "Todas":
        df_org = df_org_raw[df_org_raw['Comunidad autonoma'] == sel_comunidad].copy()
        # Para producciones, filtramos por la comunidad de la organización que la produce
        df_prod = df_prod_raw[df_prod_raw['Organizacion comunidad autonoma'] == sel_comunidad].copy()
    else:
        df_org = df_org_raw.copy()
        df_prod = df_prod_raw.copy()

    # --- PROCESAMIENTO ---
    df_org['AÑO'] = pd.to_datetime(df_org['Fecha registro forma juridica'], errors='coerce').dt.year
    df_org['EDAD'] = AÑO_ACTUAL - df_org['AÑO']

    # --- LÓGICA DE VISUALIZACIÓN ---
    if menu == " Organizaciones (Compañías)":
        st.title(f" Fichero Organizaciones: {sel_comunidad}")

        # Fila 1: Asociaciones y Formas Jurídicas
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Distribución por Asociación")
            asoc = df_org['Asociacion fk'].value_counts(normalize=True).reset_index()
            asoc.columns = ['Asociación', '%']
            asoc['%'] = (asoc['%'] * 100).round(2)
            st.dataframe(asoc, height=300)
            st.plotly_chart(px.pie(asoc, values='%', names='Asociación', hole=0.3), use_container_width=True)

        with col2:
            st.subheader("Formas Jurídicas")
            fj = df_org['Constitucion juridica actual'].value_counts().reset_index()
            fj.columns = ['Forma Jurídica', 'Nº']
            fj['%'] = (fj['Nº'] / fj['Nº'].sum() * 100).round(2)
            st.dataframe(fj, height=300)

        # Fila 2: Geografía y Géneros
        st.markdown("---")
        c3, c4 = st.columns(2)
        with c3:
            st.subheader("Distribución Geográfica")
            geo_count = df_org.groupby(['Comunidad autonoma', 'Provincia']).size().reset_index(name='Nº Compañías')
            st.plotly_chart(px.sunburst(geo_count, path=['Comunidad autonoma', 'Provincia'], values='Nº Compañías'),
                            use_container_width=True)

        with c4:
            st.subheader("Subgéneros (Número y %)")
            generos = df_org['Subgenero'].str.split(',').explode().str.strip().value_counts().reset_index()
            generos.columns = ['Subgénero', 'Recuento']
            generos['%'] = (generos['Recuento'] / len(df_org) * 100).round(2)
            st.dataframe(generos, height=400)

        # Redes Sociales
        st.markdown("---")
        st.subheader("Disponibilidad de Redes Sociales")
        rs_cols = [c for c in df_org.columns if 'Redes sociales' in c and 'red' in c and 'url' not in c]
        df_org['Nº Redes'] = df_org[rs_cols].notna().sum(axis=1)

        r1, r2 = st.columns(2)
        with r1:
            st.write("Nº de redes por cada compañía (Top 10):")
            st.table(df_org[['Nombre comercial', 'Nº Redes']].sort_values('Nº Redes', ascending=False).head(10))
        with r2:
            redes_uso = df_org[rs_cols].melt()['value'].value_counts().reset_index()
            redes_uso.columns = ['Red Social', 'Nº Cías']
            redes_uso['%'] = (redes_uso['Nº Cías'] / len(df_org) * 100).round(2)
            st.plotly_chart(px.bar(redes_uso, x='Red Social', y='%', color='Red Social', text='%'),
                            use_container_width=True)

    else:
        st.title(f" Fichero Producciones: {sel_comunidad}")
        # Aquí iría la lógica similar para producciones con sus propios filtros
        st.info("Utiliza los filtros de la izquierda para ver el análisis de espectáculos.")
        st.metric("Total Producciones en esta selección", len(df_prod))

except Exception as e:
    st.error(f"Error al cargar datos: {e}")