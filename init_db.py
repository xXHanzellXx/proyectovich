from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def inicializar_sistema():
    try:
        # 1. Conectar a Atlas con los parámetros SSL corregidos para evitar bloqueos
        uri = os.getenv("MONGO_URI")
        client = MongoClient(uri, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
        
        # 2. Acceder a la DB y Colección
        db = client["tienda"]
        productos_col = db["productos"]

        # 3. Validación de seguridad: Verificar si ya existen productos
        conteo = productos_col.count_documents({})
        
        if conteo > 0:
            print(f"⚠️ La base de datos ya tiene {conteo} productos. No se borró nada para proteger tus datos.")
        else:
            # 4. Insertar datos de prueba (Solo si la colección está vacía)
            productos_ejemplo = [
                {"nombre": "Laptop Gamer", "precio": 750000, "categoria": "Tecnología"},
                {"nombre": "Mouse Óptico", "precio": 15000, "categoria": "Accesorios"},
                {"nombre": "Teclado Mecánico", "precio": 45000, "categoria": "Accesorios"}
            ]

            print("Insertando productos base de prueba...")
            productos_col.insert_many(productos_ejemplo)
            print("✅ ¡Sistema inicializado con éxito en MongoDB Atlas!")
        
    except Exception as e:
        print(f"❌ Error al inicializar: {e}")

if __name__ == "__main__":
    inicializar_sistema()
