using MQTT

Install Mosquitto Server

By default, the Mosquitto package is not available in the Ubuntu 22.04 default repo. So you will need to add Mosquitto's official repository to the APT. You can add it with the following command:

add-apt-repository ppa:mosquitto-dev/mosquitto-ppa -y

Once the repository is added to APT, you can install it with the following command:

apt install mosquitto mosquitto-clients -y

Once the installation has been completed, you can verify the Mosquitto status with the following command:

systemctl status mosquitto

You should see the following output:

? mosquitto.service - Mosquitto MQTT Broker
     Loaded: loaded (/lib/systemd/system/mosquitto.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2022-12-06 04:50:33 UTC; 8s ago


To publish

mosquitto_pub  -m '{"event": "attribute_updated", "data": [1, "5/1026/0", 9999]}' -t "home/lights/kids_bedroom"


to subscribe

mosquitto_sub -t "sensors/response"


