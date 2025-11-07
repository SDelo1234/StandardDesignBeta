import React from "react";
import { useNavigate } from "react-router-dom";
import Selector from "../components/Selector";

const ToolsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Selector
        onSelectFences={() => navigate("/tools/fences")}
        onSelectShafts={() => navigate("/tools/shafts")}
      />
    </div>
  );
};

export default ToolsPage;
