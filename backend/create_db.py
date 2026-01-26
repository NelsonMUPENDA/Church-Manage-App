import psycopg2
from psycopg2 import sql

# Connect to PostgreSQL server
conn = psycopg2.connect(
    dbname='postgres',
    user='postgres',
    password='your_actual_password',
    host='localhost'
)

# Create a cursor object
cur = conn.cursor()

# Create the database
cur.execute(sql.SQL("CREATE DATABASE consolation_et_paix_divine;"))

# Commit changes and close the connection
conn.commit()
cur.close()
conn.close()
print('Database created successfully')
