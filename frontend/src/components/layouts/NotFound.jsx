import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[100vh] flex flex-col items-center justify-center bg-gray-50 text-gray-800 font-sans">
            <AlertCircle className="w-24 h-24 text-gray-400 mb-4" />
            <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
            <p className="text-lg mb-8 text-center">
                Oops! We couldn't find that page.<br />
                Maybe you took a wrong turn?
            </p>
            <button
                type="button"
                className="flex items-center gap-2 px-6 py-3 text-lg font-medium text-white bg-primary rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
                onClick={() => navigate("/")}
            >
                <Home className="w-5 h-5" />
                Take me home
            </button>
        </div>
    );
};

export default NotFound;
