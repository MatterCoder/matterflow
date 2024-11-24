#!/usr/bin/with-contenv bashio
echo "==> Making the temp directory called /data to hold persistent data"
mkdir -p /data

echo "==> Getting the local docker IP address"
# Retrieve the container's local IP address
myaddr=$(ip addr show eth0 | awk '$1 == "inet" {print $2}' | cut -f1 -d/)

# Append the local IP address to the .environment file
echo "LOCAL_IP=$myaddr" >> /matterflow/api/mf/.environment

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
echo "==> Matterflow API backend started!"

#Start the web interface
echo "==> Starting Matterflow Web application"
cd /matterflow/web
npm run preview
echo "==> Matterflow Web application started!"

#Start the Matter Server Dashboard
cd /python-matter-server/dashboard
./script/setup
./script/develop &

echo "==> Matter Server Dashboard started - The Matter Server Docker container needs to be started before the dashboard can be accessed"
