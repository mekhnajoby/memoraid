import socket

def check_port(host, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(2)
        try:
            s.connect((host, port))
            return True
        except:
            return False

redis_status = check_port('localhost', 6379)
mysql_status = check_port('localhost', 3306)

print(f"Redis (6379): {'RUNNING' if redis_status else 'NOT RUNNING'}")
print(f"MySQL (3306): {'RUNNING' if mysql_status else 'NOT RUNNING'}")
