import { useState, useEffect, useCallback } from 'react';
import { TextInput, Select, SelectItem } from '@tremor/react';
import { Button } from 'antd';
import * as API from '../API';

const initialInputFields = [
  {
    fieldName: '',
    fieldDatatype: 'String',  // Initial datatype is String
    subInputFields: [],
    fieldNameError: ''
  }
];

const ModelEditor = (params) => {
  const model_id = params?.model_id;
  const [inputFields, setInputFields] = useState(initialInputFields);
  const [hasModelId, setHasModelId] = useState(false);

  const fieldDatatypeOptions = [
    "String",
    "Number",
    "Boolean",
    "Object",
    "Array",
    "Timestamp",
  ];

  // Fetch data from API if model_id exists
  const init = useCallback(() => {
    if (model_id !== undefined) {
      setHasModelId(true);
      API.getModel(model_id)
        .then((res) => {
          console.log(res.data.json_data);
          var json_data = JSON.parse(res.data.json_data);
          if (json_data.length === 0 || Object.keys(json_data).length === 0) {
            json_data = [
              { fieldName: '', fieldDatatype: 'Object', subInputFields: null, fieldNameError: '' },
            ];
          }
          setInputFields(json_data);
        })
        .catch((err) => console.log(err));
    }
  }, [model_id, setHasModelId]);

  useEffect(() => {
    init();
  }, [init]);

  const updateFieldDeep = (fields, indices, key, value) => {
    if (indices.length === 1) {
      fields[indices[0]][key] = value;
    } else {
      updateFieldDeep(fields[indices[0]].subInputFields, indices.slice(1), key, value);
    }
  };

  const handleFieldNameChange = (indices, event) => {
    const newInputFields = JSON.parse(JSON.stringify(inputFields)); // Deep copy
    updateFieldDeep(newInputFields, indices, 'fieldName', event.target.value);
    setInputFields(newInputFields);
  };

  const handleDatatypeChange = (indices, event) => {
    const newInputFields = JSON.parse(JSON.stringify(inputFields)); // Deep copy
    //const selectedType = event.target.value;
    const selectedType = event;

    updateFieldDeep(newInputFields, indices, 'fieldDatatype', selectedType);

    // If type is "Object", initialize subInputFields if not already
    const field = getFieldDeep(newInputFields, indices);
    if (selectedType === 'Object' && (!field.subInputFields || field.subInputFields === null)) {
      updateFieldDeep(newInputFields, indices, 'subInputFields', []);
    }

    setInputFields(newInputFields);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    var emptyFieldNames = Object.keys(inputFields).filter((id) => {
      if (inputFields[id].fieldName.length === 0)
        console.log("empty field found!");
      return inputFields[id].fieldName.length === 0;
    });
    if (emptyFieldNames.length > 0) {
      //alert(`Please complete all fieldNames. The Field names not completed are: ${JSON.stringify(emptyFieldNames)}`)
      const values = [...inputFields];
      emptyFieldNames.forEach(function (item, index) {
        console.log(item, index);
        values[parseInt(item)]["fieldNameError"] = "Opps";
      });
      setInputFields(values);
      return;
    }
    var emptyFieldDatatypes = Object.keys(inputFields).filter((id) => {
      if (inputFields[id].fieldDatatype.length === 0)
        console.log("empty fieldDatatype found!");
      return inputFields[id].fieldDatatype.length === 0;
    });
    if (emptyFieldDatatypes.length > 0) {
      alert(
        `Please complete all fieldDatatype. The Field datatypes not completed are: ${JSON.stringify(
          emptyFieldDatatypes
        )}`
      );
      return;
    }

    const inputs = {
      json_data: JSON.stringify(inputFields),
    };

    if (hasModelId) {
      //we have an id here
      const response = await API.updateModel(model_id, inputs);
      console.log(response);
    } else {
      // Logic to send the form data to the server
      const response = await API.addModel(inputs);
      console.log(response);
    }
  };

  const handleClose = (handleCloseHandler) => {
    //close the modal now
    handleCloseHandler();
  };

  const getFieldDeep = (fields, indices) => {
    if (indices.length === 1) {
      return fields[indices[0]];
    } else {
      return getFieldDeep(fields[indices[0]].subInputFields, indices.slice(1));
    }
  };

  const addFieldAtSameLevel = (parentIndices) => {
    const newInputFields = JSON.parse(JSON.stringify(inputFields)); // Deep copy
    const parentField = parentIndices.length === 0 ? newInputFields : getFieldDeep(newInputFields, parentIndices);
    
    const newField = {
      fieldName: '',
      fieldDatatype: 'String',  // New fields default to "String"
      subInputFields: null,
      fieldNameError: ''
    };

    if (Array.isArray(parentField)) {
      parentField.push(newField);  // Top-level addition
    } else {
      parentField.subInputFields.push(newField);  // Nested addition
    }

    setInputFields(newInputFields);
  };

  const addSubInputField = (indices) => {
    const newInputFields = JSON.parse(JSON.stringify(inputFields)); // Deep copy
    const field = getFieldDeep(newInputFields, indices);

    if (!field.subInputFields) {
      field.subInputFields = [];
    }

    field.subInputFields.push({
      fieldName: '',
      fieldDatatype: 'String',  // Subfields default to "String"
      subInputFields: null,
      fieldNameError: ''
    });

    setInputFields(newInputFields);
  };

  const removeSubInputField = (indices) => {
    const newInputFields = JSON.parse(JSON.stringify(inputFields)); // Deep copy

    if (indices.length === 1) {
      newInputFields.splice(indices[0], 1);  // Remove top-level field
    } else {
      const parentField = getFieldDeep(newInputFields, indices.slice(0, -1));
      parentField.subInputFields.splice(indices[indices.length - 1], 1);  // Remove nested subfield
    }

    setInputFields(newInputFields);
  };

  const renderInputFields = (fields, parentIndices = [], level = 0) => {
    return (
      <div>
        {fields.map((field, index) => {
          const indices = [...parentIndices, index]; // Track path for recursion

          return (
            <div key={index} style={{ marginLeft: `${level * 20}px`, marginBottom: '10px', display: 'block' }} >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextInput
                  value={field.fieldName}
                  onChange={(e) => handleFieldNameChange(indices, e)}
                  placeholder="Field Name"
                  style={{ marginRight: '10px', flex: 1 }}
                />
                <Select
                  value={field.fieldDatatype}
                  onChange={(e) => handleDatatypeChange(indices, e)}
                  style={{ marginRight: '10px', flex: 1 }}
                >
                {fieldDatatypeOptions.map((fieldDatatype, selectIndex) => (
                <SelectItem key={selectIndex} value={fieldDatatype}>
                  {fieldDatatype}
                </SelectItem>
                ))}                  
                </Select>

                {field.fieldDatatype === 'Object' && (
                  <Button
                    shape="circle"
                    type="primary"
                    onClick={() => addSubInputField(indices)}
                    style={{ marginRight: '10px' }}
                  >
                    +
                  </Button>
                )}

                <Button
                  danger
                  shape="circle"
                  type="primary"
                  onClick={() => removeSubInputField(indices)}
                  style={{ marginRight: '10px' }}
                >
                  -
                </Button>
              </div>

              {/* Render subInputFields if available */}
              {Array.isArray(field.subInputFields) && (
                <div style={{ marginTop: '10px' }}>
                  {renderInputFields(field.subInputFields, indices, level + 1)}
                </div>
              )}
            </div>
          );
        })}

        {/* Button to add a field at the same level */}
        {level === 0 && (
        <Button
        type="default"
        size="sm"
        onClick={() => addFieldAtSameLevel(parentIndices)}
        >
        Add Top Level Field
        </Button>
        )} 
      </div>
    );
  };

  return (
    <form
    onSubmit={(event) => {
      handleSubmit(event);
      handleClose(params.handleClose);
    }}
    className="space-y-4"
  >
      <>
      {renderInputFields(inputFields)}
      <Button type="primary" htmlType="submit">
              Submit
      </Button>      
      </>
    </form>
  );
};

export default ModelEditor;