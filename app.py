from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# 1. CORS CONFIGURADO PARA DESARROLLO (Acepta todo)
CORS(app, resources={r"/*": {"origins": "*"}})

# 2. CONEXIÓN CON VALIDACIÓN DE ERRORES
try:
    mongo_uri = os.getenv("MONGO_URI")
    # serverSelectionTimeoutMS hace que no se quede pegado 30 segundos si la clave está mal
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client["tienda"]
    productos_col = db["productos"]
    
    # Intentar un comando simple para confirmar conexión
    client.admin.command('ping')
    print("✅ ¡Conexión exitosa a MongoDB Atlas!")
except Exception as e:
    print(f"❌ ERROR DE CONEXIÓN A MONGO: {e}")

@app.route("/productos", methods=["GET"])
def get_all():
    try:
        res = []
        # Buscamos todos los productos
        for p in productos_col.find():
            p["_id"] = str(p["_id"])
            res.append(p)
        return jsonify(res), 200
    except Exception as e:
        print(f"Error en GET: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/productos", methods=["POST"])
def create():
    try:
        data = request.json
        if not data.get("nombre") or not data.get("precio"):
            return jsonify({"error": "Faltan campos"}), 400
        
        nuevo_id = productos_col.insert_one(data).inserted_id
        return jsonify({"mensaje": "Creado", "id": str(nuevo_id)}), 201
    except Exception as e:
        print(f"Error en POST: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/productos/<id>", methods=["DELETE"])
def delete(id):
    try:
        productos_col.delete_one({"_id": ObjectId(id)})
        return jsonify({"mensaje": "Eliminado"}), 200
    except Exception as e:
        return jsonify({"error": "ID inválido"}), 400

@app.route("/productos/<id>", methods=["PUT"])
def update(id):
    try:
        data = request.json
        productos_col.update_one({"_id": ObjectId(id)}, {"$set": data})
        return jsonify({"mensaje": "Actualizado"}), 200
    except Exception as e:
        return jsonify({"error": "Error al actualizar"}), 400
# Añade esto a tus colecciones
usuarios_col = db["usuarios"]

@app.route("/registro", methods=["POST"])
def registro():
    data = request.json
    if usuarios_col.find_one({"usuario": data['usuario']}):
        return jsonify({"error": "El usuario ya existe"}), 400
    usuarios_col.insert_one(data)
    return jsonify({"mensaje": "Usuario registrado"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = usuarios_col.find_one({"usuario": data['usuario'], "password": data['password']})
    if user:
        return jsonify({
            "usuario": user['usuario'],
            "rol": user.get('rol', 'cliente') # por defecto cliente
        }), 200
    return jsonify({"error": "Credenciales inválidas"}), 401
if __name__ == "__main__":
    # Escuchamos en todas las interfaces para evitar bloqueos de red local
    app.run(debug=True, port=5000, host='0.0.0.0')