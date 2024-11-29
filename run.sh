#!/usr/bin/with-contenv bashio
echo "==> Making the temp directory called /data to hold persistent data"
mkdir -p /data

echo "==> Ensuring /config exists and is writable"
mkdir -p /config
chmod 1777 /config

if [ ! -L /tmp ]; then
  echo "==> Remapping /tmp to /config"
  # Create a temporary location for active `/tmp` files
  TMP_BACKUP=$(mktemp -d /config/tmp-backup.XXXXXX)
  
  # Move the contents of /tmp to the backup location (if applicable)
  mv /tmp/* "$TMP_BACKUP" 2>/dev/null || true
  
  # Remove the original /tmp directory
  rm -rf /tmp
  
  # Create the symbolic link
  ln -s /config /tmp
  
  # Restore moved files to the new /tmp (now /config)
  mv "$TMP_BACKUP"/* /tmp 2>/dev/null || true
  rmdir "$TMP_BACKUP"
fi

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

#Start the Matter Server Dashboard
echo "==> Starting the Matter Server Dashboard"
cd /python-matter-server/dashboard
# Run setup script and suppress output
./script/setup > /dev/null 2>&1
# Run the develop script in the background and suppress its output
./script/develop > /dev/null 2>&1 &
echo "==> Matter Server Dashboard started - The Matter Server Docker container needs to be started before the dashboard can be accessed"

#Start the web interface
echo "==> Starting Matterflow Web application"
cd /matterflow/web
npm run preview 
echo "==> Matterflow Web application started!"

