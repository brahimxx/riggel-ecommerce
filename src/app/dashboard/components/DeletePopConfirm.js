import React from "react";
import { Button, App, Popconfirm } from "antd";

const DeletePopConfirm = ({
  title,
  description,
  icon,
  onConfirm, // accept onConfirm as prop
  onCancel,
}) => {
  const { message } = App.useApp();
  // Default cancel handler if none passed
  const handleCancel = (e) => {
    if (onCancel) onCancel(e);
    else {
      console.log(e);
      message?.error("Click on No");
    }
  };

  // Default confirm handler if none passed
  const handleConfirm = (e) => {
    if (onConfirm) onConfirm(e);
    else {
      console.log(e);
      message?.success("Click on Yes");
    }
  };

  return (
    <Popconfirm
      title={title}
      description={description}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      okText="Yes"
      cancelText="No"
    >
      <Button danger icon={icon}>
        Delete
      </Button>
    </Popconfirm>
  );
};

export default DeletePopConfirm;
