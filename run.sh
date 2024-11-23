#!/usr/bin/with-contenv bashio
echo "==> Making the temp directory called /data to hold persistent data"
mkdir -p /data

echo "==> Getting the local docker IP address"
# Retrieve the container's local IP address
myaddr=$(ip addr show eth0 | awk '$1 == "inet" {print $2}' | cut -f1 -d/)

# Append the local IP address to the .environment file
echo "ALLOWED_HOSTS=$myaddr" >> /matterflow/api/mf/.environment
echo "==> Starting Matterflow API backend"

# Activate the virtual environment
source /matterflow/api/venv/bin/activate

#Start supervisord
cd /matterflow/api
supervisord -c ./supervisord.conf 

cd /matterflow/api/mf

#Migrate the sql database
python3 manage.py migrate

#Start the server
PYTHONWARNINGS="ignore" python3 manage.py runserver &
echo "Matterflow API backend started!"

echo "==> Starting Matterflow Web application"

#Start the Matter server & dashboard
cd /python-matter-server
python -m matter_server.server &

cd /python-matter-server/dashboard
./script/develop &

echo "==> Starting Matterflow Web application"

cd /matterflow/web
#npm run dev
npm run preview
echo "Matterflow Web application started!"
