import { apiService } from "../services/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ApplicationData {
  fullName: string;
  email: string;
  [key: string]: any;
}

export const useApplication = (initialData: ApplicationData) => {
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ApplicationData>(initialData);
  const navigate = useNavigate();

  // Load or create application
  const loadOrCreateApplication = async () => {
    if (!applicationId) {
      // No ID yet, create a new application
      try {
        const response = await apiService.request("/applications", { method: "POST", body: JSON.stringify(formData) });
        setApplicationId((response as any).application_id);
        console.log("New application created:", (response as any).application_id);
      } catch (error) {
        console.error("Failed to create application:", error);
      }
      return;
    }

    // Try loading existing application
    try {
      const data = await apiService.request(`/applications/${applicationId}`, { method: "GET" });
      setFormData(data as ApplicationData);
      console.log("Application loaded:", applicationId);
    } catch (error: any) {
      if (error.message.includes("Not Found")) {
        console.warn("Application not found, creating a new one...");
        try {
          const response = await apiService.request("/applications", { method: "POST", body: JSON.stringify(formData) });
          setApplicationId((response as any).application_id);
          console.log("New application created:", (response as any).application_id);
        } catch (createError) {
          console.error("Failed to create application:", createError);
        }
      } else {
        console.error(error);
      }
    }
  };

  // Update application
  const updateApplication = async (updatedData: Partial<ApplicationData>) => {
    if (!applicationId) {
      console.warn("No application ID available. Creating a new application first...");
      await loadOrCreateApplication();
    }
    try {
      const data = await apiService.request(
        `/applications/${applicationId}`,
        { method: "PUT", body: JSON.stringify(updatedData) }
      );
      setFormData(data as ApplicationData);
      console.log("Application updated:", applicationId);
    } catch (error) {
      console.error("Failed to update application:", error);
    }
  };

  // Auto-save example every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (applicationId) updateApplication(formData);
    }, 30000); // 30 sec

    return () => clearInterval(interval);
  }, [applicationId, formData]);

  return { applicationId, formData, setFormData, loadOrCreateApplication, updateApplication };
};
