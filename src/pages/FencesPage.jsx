import React, { useCallback, useMemo, useState } from "react";
import FenceInputs from "../components/FenceInputs";
import FenceOptions from "../components/FenceOptions";
import Map from "../components/Map";
import WindResults from "../components/WindResults";
import useWind from "../hooks/useWind";

const IMG1 = "https://i.ibb.co/LzMWRbqj/IMG1-fence-1.jpg";
const IMG2 = "https://i.ibb.co/Kc61kkHd/IMG2-fence-2.jpg";
const IMG3 = "https://i.ibb.co/VYkkBwWW/IMG3-fence-3.jpg";
const IMG4 = "https://i.ibb.co/pBCs5YHd/IMG4-fence-4.jpg";

const initialForm = {
  projectName: "",
  postcode: "",
  duration: "< 28 days",
  ground: "Hardstanding (concrete/asphalt)",
  height: "2.0 m",
  distanceToSea: "",
  altitude: "",
};

const postcodeRegex = /^\s*[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}\s*$/i;

const FencesPage = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [selected, setSelected] = useState([]);

  const { wind } = useWind(form.postcode);

  const options = useMemo(
    () => [
      { id: "A", name: "2.0 m panels @ 3.5 m centres", capacity_kpa: 0.1, maxHeight_m: 2.0, img: IMG3 },
      { id: "B", name: "2.0 m panels + rear brace/ballast", capacity_kpa: 0.2, maxHeight_m: 2.0, img: IMG2 },
      { id: "C", name: "2.4 m hoarding with buttress @ 2.4 m", capacity_kpa: 0.3, maxHeight_m: 2.4, img: IMG1 },
      { id: "D", name: "2.4 m mesh with rear braces @ 2.4 m", capacity_kpa: 0.3, maxHeight_m: 2.4, img: IMG2 },
      { id: "E", name: "2.4 m hoarding + heavy ballast", capacity_kpa: 0.4, maxHeight_m: 2.4, img: IMG1 },
      { id: "F", name: "3.0 m hoarding with twin buttress", capacity_kpa: 0.5, maxHeight_m: 3.0, img: IMG4 },
    ],
    []
  );

  const requiredHeight = useMemo(() => parseFloat(form.height), [form.height]);

  const validateField = useCallback((key, value) => {
    if (key === "projectName") {
      return value.trim() ? "" : "Project name is required.";
    }
    if (key === "postcode") {
      return postcodeRegex.test(value.trim()) ? "" : "Enter a valid UK postcode (e.g., SW4 6QD).";
    }
    return "";
  }, []);

  const updateField = useCallback((key, value) => {
    const nextValue = key === "postcode" ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
    const message = validateField(key, nextValue);
    setErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[key] = message;
      } else {
        delete next[key];
      }
      return next;
    });
  }, [validateField]);

  const handleToggle = useCallback((id, disabled) => {
    if (disabled) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Site-Specific Heras Fencing – Quick Setup</h1>
        <p className="text-sm text-gray-600">
          Enter basic details to generate site-specific designs and a calculation pack.
        </p>
      </header>

      <Map postcode={form.postcode} onPostcodeChange={(value) => updateField("postcode", value)} />
      <FenceInputs form={form} errors={errors} onChange={updateField} />

      {wind && (
        <section className="mt-8 space-y-6">
          <WindResults wind={wind} />
          <FenceOptions
            options={options}
            selected={selected}
            wind={wind}
            requiredHeight={requiredHeight}
            onToggle={handleToggle}
          />
        </section>
      )}
    </div>
  );
};

export default FencesPage;
