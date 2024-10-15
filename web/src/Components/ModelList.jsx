import { useState, useEffect } from "react";
import {
  ListGroup,
  Button,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import ModelModal from "./ModelModal"; // Import the model modal component
import * as API from "../API";
import { Button as AntdButton, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

const useFetch = () => {
  const [models, setModels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response1 = await API.getModels();
      console.log("response1");
      console.log(response1);
      setModels(response1.data);
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

  return { models, loading, error, refetch };
};

const ModelList = () => {
  const { models, loading, error, refetch } = useFetch();
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

  if (!models) {
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
    const inputModelData = {
      id: id,
      description: renameValue,
    };
    API.updateModel(id, inputModelData).then(() => {
      console.log("Model saved successfully");
      refetch();
    });

    setRenamingId(null);
  };

  // Function to find the next unique ID for models or instances
  const getNextItemId = () => {
    const items = models;
    if (items.length === 0) return 1; // Return 1 if the array is empty
    const itemIds = items.map((item) => item.id);
    const maxId = Math.max(...itemIds); // Find the maximum existing ID
    return maxId + 1; // Return the next highest ID
  };

  // Handler to add a new item (model or instance)
  const handleAddItem = () => {
    const newId = getNextItemId();
    const newUniqueId = `unique${newId}`; // Simple unique ID
    const newItem = {
      id: newId,
      description: newUniqueId,
      name: `newModel${newId}.json`,
      json_data: {},
    };

    // Logic to send the form data to the server
    API.addModel(newItem)
      .then(() => {
        console.log("Model added successfully");
        refetch();
      })
      .catch((err) => console.log(err));
    setBoldItemId(newId); // Highlight the newly added item in bold
  };

  // Handler to delete an item (model or instance)
  const handleDelete = (id) => {
    API.deleteModel(id)
      .then(() => {
        console.log("Model deleted successfully");
        refetch();
      })
      .catch((err) => console.log(err));
  };

  if (Object.keys(models).length === 0) {
    return (
      <>
        <div>You have no saved models.</div>
        {/* Button to add new model */}
        <div className="mt-3 text-center">
          <Button variant="outline-success" onClick={() => handleAddItem()}>
            Add New Model
          </Button>
        </div>
      </>
    );
  }

  // Rendering a list of items (models)
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
                    icon={<EditOutlined />}
                    onClick={() => handleRename(item.id, item.description)}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <AntdButton
                    type="text"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDelete(item.id)}
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
      {renderList(models, "model")}

      {/* Button to add new model */}
      <div className="mt-3 text-center">
        <Button variant="outline-success" onClick={() => handleAddItem()}>
          Add New Model
        </Button>
      </div>
      {/* Full-screen modal for models */}
      {selectedItem && (
        <>
          <ModelModal
            show={showModal}
            handleClose={handleCloseModal}
            modelName={selectedItem.description}
            modelId={selectedItem.id}
          />
        </>
      )}
    </div>
  );
};

export default ModelList;
