from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def inicializar_sistema():
    try:
        # 1. Conectar a Atlas
        uri = os.getenv("MONGO_URI")
        client = MongoClient(uri)
        
        # 2. Crear (o acceder) a la DB y Colección
        db = client["tienda"]
        productos_col = db["productos"]

        # 3. Limpiar datos viejos (opcional, para empezar de cero)
        print("Limpiando base de datos...")
        productos_col.delete_many({})

        # 4. Insertar datos de prueba (Seed Data)
        productos_ejemplo = [
            {"nombre": "Laptop Gamer", "precio": 750000},
            {"nombre": "Mouse Óptico", "precio": 15000},
            {"nombre": "Teclado Mecánico", "precio": 45000}
        ]

        print("Insertando productos de prueba...")
        productos_col.insert_many(productos_ejemplo)

        print("✅ ¡Sistema inicializado con éxito en MongoDB Atlas!")
        
    except Exception as e:
        print(f"❌ Error al inicializar: {e}")

if __name__ == "__main__":
    inicializar_sistema()