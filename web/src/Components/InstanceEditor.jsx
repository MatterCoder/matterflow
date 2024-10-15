import { useState, useEffect } from "react";
import { TextInput } from "@tremor/react";
import { Button } from "antd";
import * as API from "../API";
import ModelSelect from "./ModelSelect";
import JMESPathTester from "./JMESPathTester";

const InstanceEditor = (params) => {
  const [dirty, setDirty] = useState(false);
  const [inputFields, setInputFields] = useState([]);
  const instance_id = params?.instance_id;

  const hasInstanceId = instance_id !== undefined;
  
  useEffect(() => {
    if (hasInstanceId) {
      const init = () => {
        API.getInstance(instance_id).then((res) => {
          let json_data = JSON.parse(res.data.json_data.replace(/'/g, '"'));
          if (json_data.length === 0 || Object.keys(json_data).length === 0) {
            json_data = [];
          }
          setInputFields(json_data);
        });
      };
      init(); // Call the init function inside the effect
    }
  }, [hasInstanceId, instance_id]); // Add all variables that the effect depends on


  const transformJson = (json) => {
    return json.map((element) => {
      const newElement = {
        fieldName: element.fieldName,
        fieldDatatype: element.fieldDatatype,
        fieldNameError: element.fieldNameError || "",
      };

      if (element.subInputFields) {
        newElement.subInputFields = transformJson(element.subInputFields);
      } else {
        newElement.subInputFields = null;
      }

      return newElement;
    });
  };

  const handleValueChange = (value) => {
    console.log("handleValueChange");

    if (dirty && confirm("This will delete your work!") == false) {
      return;
    }

    let json = null;
    try {
      json = JSON.parse(value);
    } catch (error) {
      console.error("Invalid JSON format:", error);
      return;
    }

    const newModelArray = transformJson(json);

    setInputFields(newModelArray);
  };

  const handleChangeInput = (indices, event) => {
    const newInputFields = JSON.parse(JSON.stringify(inputFields));
    const field = getFieldDeep(newInputFields, indices);
    const value = event.target.value;

    field[event.target.name] = value;

    // Check if the field is of type Object
    if (field.fieldDatatype === "Object") {
      // Hide subfields if value is not empty
      if (value) {
        field.subInputFieldsHidden = true;
      } else {
        // Show subfields if the value is cleared
        field.subInputFieldsHidden = false;
      }
    }

    setInputFields(newInputFields);
  };

  const handleDrop = (indices, event) => {
    event.preventDefault();
    setDirty(true);
    const dropValue = event.dataTransfer
      .getData("text")
      .replace(/(<([^>]+)>)/gi, "");

    const newInputFields = JSON.parse(JSON.stringify(inputFields));
    const field = getFieldDeep(newInputFields, indices);

    field[event.target.name] = dropValue;

    // Check if the field is of type Object
    if (field.fieldDatatype === "Object") {
      // Hide subfields if value is not empty
      if (dropValue) {
        field.subInputFieldsHidden = true;
      } else {
        // Show subfields if the value is cleared
        field.subInputFieldsHidden = false;
      }
    }

    setInputFields(newInputFields);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getFieldDeep = (fields, indices) => {
    if (indices.length === 1) {
      return fields[indices[0]];
    } else {
      const field = fields[indices[0]];
      if (field.subInputFields && Array.isArray(field.subInputFields)) {
        return getFieldDeep(field.subInputFields, indices.slice(1));
      } else {
        console.warn("subInputFields is either undefined or not an array");
        return null;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const inputs = {
      json_data: JSON.stringify(inputFields),
    };

    if (hasInstanceId) {
      const response = await API.updateInstance(instance_id, inputs);
      console.log(response);
    } else {
      const response = await API.addInstance(inputs);
      console.log(response);
    }
  };

  const handleClose = (handleCloseHandler) => {
    handleCloseHandler();
  };

  const renderFields = (indices, inputField, level) => {
    const indentStyle = { marginLeft: `${level * 20}px` };

    return (
      <div key={indices.join("-")} style={indentStyle} className="space-y-2">
        <div className="flex items-center space-x-2">
          <TextInput
            name="fieldName"
            placeholder="Field Name"
            disabled={true}
            value={inputField.fieldName}
            className="form-input px-4 py-2 rounded border"
          />
          <TextInput
            name="fieldDatatype"
            placeholder="Field Data Type"
            disabled={true}
            value={inputField.fieldDatatype}
            className="form-input px-4 py-2 rounded border"
          />
          <TextInput
            name="fieldValue"
            placeholder="Field Value"
            value={inputField.fieldValue || ""}
            onDrop={(event) => handleDrop(indices, event)}
            onDragOver={handleDragOver}
            onChange={(event) => handleChangeInput(indices, event)}
            className="form-input px-4 py-2 rounded border"
          />
        </div>

        {inputField.subInputFields &&
          !inputField.subInputFieldsHidden && // Conditionally render subfields based on hidden flag
          inputField.subInputFields.map((subField, subIndex) =>
            renderFields([...indices, subIndex], subField, level + 1)
          )}
      </div>
    );
  };

  return (
    <div className="ModelEditor">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h1>Map the JSON fields to data model</h1>
          <div className="container mx-auto p-4">
            <ModelSelect onValueChange={handleValueChange} />
          </div>
          <div className="container mx-auto p-4">
            <form
              onSubmit={(event) => {
                handleSubmit(event);
                handleClose(params.handleClose);
              }}
              className="space-y-4"
            >
              {inputFields.map((inputField, index) =>
                renderFields([index], inputField, 0)
              )}
              <Button htmlType="submit" type="primary">
                Submit
              </Button>
            </form>
          </div>
        </div>
        <div>
          <JMESPathTester />
        </div>
      </div>
    </div>
  );
};

export default InstanceEditor;
