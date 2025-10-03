import { useState } from "react";
import Sidebar from "../../components/sidebarLayout";
import SettingsNavigation from "../../components/sidebarNavLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";

const AppearanceSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Custom colors for selected theme button
  const themeButtonColors = {
    light: "border-blue-400 bg-blue-100 text-blue-800",
    dark: "border-indigo-500 bg-indigo-900 text-indigo-100",
  };

  return (
    <div
      className={`flex min-h-screen w-screen ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <div className="grid grid-cols-12 gap-6 mb-6">
            <div className="col-span-2">
              <SettingsNavigation />
            </div>
            <div className="col-span-10">
              <div
                className={`max-w-8xl mx-auto p-6 rounded-xl shadow ${
                  theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
                }`}
              >
                <h1
                  className={`text-2xl font-semibold mb-4 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Appearance Settings
                </h1>
                <p
                  className={`mb-6 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Customize the look and feel of your workspace.
                </p>
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <h2
                      className={`text-lg font-semibold mb-2 ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Theme
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {["light", "dark"].map((t) => (
                        <label key={t} className="cursor-pointer">
                          <input
                            type="radio"
                            name="theme"
                            value={t}
                            checked={theme === t}
                            onChange={() => setTheme(t as any)}
                            className="sr-only peer"
                          />
                          <div
                            className={`p-3 border-2 rounded-lg text-center capitalize transition-colors ${
                              theme === t
                                ? themeButtonColors[t as "light" | "dark"]
                                : theme === "dark"
                                ? "border-gray-700 bg-gray-700 text-white"
                                : "border-gray-200 bg-gray-100 text-gray-700"
                            }`}
                          >
                            {t}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* End Theme */}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppearanceSettings;


