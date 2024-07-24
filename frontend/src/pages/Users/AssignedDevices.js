import React, { useEffect, useRef, useState } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdOutlineGpsFixed } from "react-icons/md";
import { Link } from "react-router-dom";
import deliveryVanIconUrl from "../../assets/delivery_van_icon.png"; // Ensure the path is correct
import "../Home/Home.scss"; // You can reuse the same styles
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { logoutUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import { SET_LOGIN } from "../../redux/features/auth/authSlice";
import { selectUser } from '../../redux/selectors';

const REACT_APP_FLESPI_TOKEN = process.env.REACT_APP_FLESPI_TOKEN;

const AssignedDevices = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [deviceData, setDeviceData] = useState([]);
  const [deviceDetails, setDeviceDetails] = useState({});

  const logout = async () => {
    await logoutUser();
    await dispatch(SET_LOGIN(false));
    navigate("/");
  };

  // Fetch assigned devices data
  useEffect(() => {
    const fetchAssignedDevices = async () => {
      if (!user || !user._id) {
        console.error("User ID is not defined");
        return;
      }
      
      console.log(`Fetching devices for user ID: ${user._id}`);
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/${user._id}/devices`);
        console.log("Assigned devices data:", response.data); // Log the entire response
        if (Array.isArray(response.data)) {
          // Flatten the nested arrays
          const flatDeviceData = response.data.flat();
          console.log("Flattened device data:", flatDeviceData);
          setDeviceData(flatDeviceData);
        } else {
          console.error("Assigned devices response is not an array:", response.data);
          setDeviceData([]);
        }
      } catch (error) {
        console.error("Error fetching assigned devices:", error);
        setDeviceData([]);
      }
    };

    if (user && user._id) {
      fetchAssignedDevices();
    }
  }, [user]);


  // Fetch device details
  useEffect(() => {
    const fetchDeviceDetails = async (deviceId) => {
      try {
        const response = await axios.get(`/gw/devices/${deviceId}`, {
          headers: {
            'Authorization': `FlespiToken ${REACT_APP_FLESPI_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`API response for device ${deviceId}:`, response.data); // Log the entire response

        if (response.data && response.data.result && response.data.result.length > 0) {
          const deviceData = response.data.result[0];
          console.log(`Fetched data for device ${deviceId}:`, deviceData); // Debug log
          setDeviceDetails(prevDetails => ({
            ...prevDetails,
            [deviceId]: deviceData
          }));
        } else {
          console.warn(`No device data found for device ID: ${deviceId}`);
        }
      } catch (error) {
        console.error('Error fetching device details:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
      }
    };

    if (deviceData.length > 0) {
      deviceData.forEach(deviceId => {
        if (!deviceDetails[deviceId]) {
          fetchDeviceDetails(deviceId);
        }
      });
    }
  }, [deviceData, deviceDetails]);


  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      const initializedMap = L.map(mapRef.current).setView([53.4808, -2.2426], 6);
      const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const attribution = '&copy; <a href="http://arexperts.co.uk/">AR Experts LTD</a>';
      L.tileLayer(tileUrl, { attribution }).addTo(initializedMap);

      mapInstance.current = initializedMap;
      console.log('Map initialized'); // Debug log for map initialization
    }
  }, []);

  useEffect(() => {
    if (mapInstance.current && deviceData.length > 0) {
      // Clear existing markers before adding new ones
      markersRef.current.forEach(marker => mapInstance.current.removeLayer(marker));
      markersRef.current = [];

      console.log('Device Data:', deviceData); // Debug log for device data

      const updatedDeviceData = deviceData.map(deviceId => {
        const deviceDetail = deviceDetails[deviceId];
        const longitude = deviceDetail?.position?.longitude;
        const latitude = deviceDetail?.position?.latitude;
        const deviceName = deviceDetail ? deviceDetail.name : 'Unknown';

        console.log('Device:', { deviceDetail, longitude, latitude, deviceName }); // Debug log for each device

        return { longitude, latitude, deviceName, deviceId };
      }).filter(device => device.longitude && device.latitude);

      console.log('Updated Device Data:', updatedDeviceData); // Debug log for updated device data

      updatedDeviceData.forEach(device => {
        const { longitude, latitude, deviceName, deviceId } = device;
        const popupContent = 
          `<div class="custom-popup">
            <h4>${deviceName}</h4>
            <p>Device ID: ${deviceId}</p>
            <p class="phone-number"><a href="/dashboard">Monitor the device</a></p>
          </div>`;

        const marker = L.marker([latitude, longitude], {
          icon: L.icon({ 
            iconUrl: deliveryVanIconUrl, 
            iconSize: [30, 40], 
            iconAnchor: [15, 40],
            popupAnchor: [0, -40]
          })
        })
          .addTo(mapInstance.current)
          .bindPopup(popupContent);

        markersRef.current.push(marker);
      });
    }
  }, [deviceData, deviceDetails]);

  const flyToDevice = (device) => {
    if (mapInstance.current) {
      const { longitude, latitude } = device;
      mapInstance.current.flyTo([latitude, longitude], 14, { duration: 3 });
    }
  };

  return (
    <div className="home">
      <nav className="navbar">
        <div className="container --flex-between">
          <div className="navbar-brand">
            <MdOutlineGpsFixed size={35} />
            <span>AR Experts LTD</span>
          </div>
          <ul className="navbar-links">
            <li><button className="btn-primary" onClick={logout} >Logout</button></li>
          </ul>
          <div className="navbar-toggle">
            <button className="btn-primary"><Link to="/dashboard">Dashboard</Link></button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="store-list">
          <div className="heading">
            <h2>Assigned Devices</h2>
          </div>
          <ul className="list">
            {Array.isArray(deviceData) && deviceData.map((deviceId, index) => {
              const deviceDetail = deviceDetails[deviceId];
              const deviceName = deviceDetail ? deviceDetail.name : 'Unknown';

              return (
                <li key={index} onClick={() => flyToDevice(deviceDetail)}>
                  <div className="shop-item">
                    <Link to={`/dashboard/${deviceId}`} className="link-button">{deviceName}</Link>
                    <p>Device ID: {deviceId}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div id="map" ref={mapRef} className="map-container"></div>
      </main>
    </div>
  );
};

export default AssignedDevices;
