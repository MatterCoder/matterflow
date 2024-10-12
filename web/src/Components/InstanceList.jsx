import React, { useState, useEffect } from "react";
import {
  ListGroup,
  Button,
  InputGroup,
  FormControl,
  Tabs,
  Tab,
} from "react-bootstrap";
import InstanceModal from "./InstanceModal"; // Import the instance modal component
import * as API from "../API";

import { Button as AntdButton, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

const useFetch = () => {
  const [instances, setInstances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response1 = await API.getInstances();
      console.log("response1");
      console.log(response1);
      setInstances(response1.data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setLoading(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { instances, loading, error, refetch };
};

const InstanceList = () => {
  const { instances, loading, error, refetch } = useFetch();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [boldItemId, setBoldItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!instances) {
    return <div>No data.</div>;
  }

  // Handler to alert the item name and make the item name bold
  const handleItemClick = (item) => {
    //alert(`You clicked on: ${item.name}`);
    setBoldItemId(item.id); // Set the clicked item to bold
    setSelectedItem(item);
    setShowModal(true);
  };

  // Handler to close the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Handler to start renaming an item
  const handleRename = (id, currentName) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  // Handler to confirm renaming
  const handleRenameConfirm = (id) => {
    const inputInstanceData = {
      id: id,
      description: renameValue,
    };
    API.updateInstance(id, inputInstanceData).then(() => {
      console.log("Instance saved successfully");
      refetch();
    });

    setRenamingId(null);
  };

  // Function to find the next unique ID for instances or instances
  const getNextItemId = () => {
    const items = instances;
    if (items.length === 0) return 1; // Return 1 if the array is empty
    const itemIds = items.map((item) => item.id);
    const maxId = Math.max(...itemIds); // Find the maximum existing ID
    return maxId + 1; // Return the next highest ID
  };

  // Handler to add a new item (instance or instance)
  const handleAddItem = () => {
    const newId = getNextItemId();
    const newUniqueId = `unique${newId}`; // Simple unique ID
    const newItem = {
      id: newId,
      description: newUniqueId,
      name: `newInstance${newId}.json`,
      json_data: {},
    };

    // Logic to send the form data to the server
    API.addInstance(newItem)
      .then(() => {
        console.log("Instance added successfully");
        refetch();
      })
      .catch((err) => console.log(err));
    setBoldItemId(newId); // Highlight the newly added item in bold
  };

  // Handler to delete an item (instance or instance)
  const handleDelete = (id) => {
    API.deleteInstance(id)
      .then(() => {
        console.log("Instance deleted successfully");
        refetch();
      })
      .catch((err) => console.log(err));
  };

  if (Object.keys(instances).length === 0) {
    return (
      <>
        <div>You have no saved instances.</div>
        {/* Button to add new instance */}
        <div className="mt-3 text-center">
          <Button variant="outline-success" onClick={() => handleAddItem()}>
            Add New Instance
          </Button>
        </div>
      </>
    );
  }

  // Rendering a list of items (instances)
  const renderList = (items) => (
    <div
      style={{
        maxHeight: "300px",
        overflowY: items.length > 5 ? "scroll" : "auto",
      }}
    >
      <ListGroup>
        {items.map((item) => (
          <ListGroup.Item
            key={item.id} // Using uniqueId for key
            className="d-flex justify-content-between align-items-center"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
                {/* Item name or Rename Input */}
                {renamingId === item.id ? (
                  <InputGroup size="sm" style={{ maxWidth: "200px" }}>
                    <FormControl
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                    />
                    <Button
                      variant="outline-success"
                      onClick={() => handleRenameConfirm(item.id)}
                    >
                      Save
                    </Button>
                  </InputGroup>
                ) : (
                  <span
                    onClick={() => handleItemClick(item)}
                    style={{
                      cursor: "pointer",
                      fontWeight: boldItemId === item.id ? "bold" : "normal", // Make item name bold if clicked
                    }}
                  >
                    {item.description}
                  </span>
                )}
              </div>

              {/* Action buttons: Rename and Delete */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Tooltip title="Rename">
                  <AntdButton
                    type="text"
                    onClick={() => handleRename(item.id, item.description)}
                    icon={<EditOutlined />}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <AntdButton
                    type="text"
                    onClick={() => handleDelete(item.id)}
                    icon={<DeleteOutlined />}
                    danger
                  />
                </Tooltip>
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );

  return (
    <div>
      {renderList(instances)}

      {/* Button to add new instance */}
      <div className="mt-3 text-center">
        <Button variant="outline-success" onClick={() => handleAddItem()}>
          Add New Instance
        </Button>
      </div>
      {/* Full-screen modal for instances */}
      {selectedItem && (
        <>
          <InstanceModal
            show={showModal}
            handleClose={handleCloseModal}
            instanceName={selectedItem.description}
            instanceId={selectedItem.id}
          />
        </>
      )}
    </div>
  );
};

export default InstanceList;
