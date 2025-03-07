import mysql.connector

mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Tcorde0@"
)

cursor = mydb.cursor()
cursor.execute("CREATE DATABASE IF NOT EXISTS sistema_chamados")
print("Banco de dados 'sistema_chamados' criado com sucesso!")
