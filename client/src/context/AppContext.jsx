/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Automatically set Authorization header for other axios calls
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    try {
      const { data } = await axios.get("/api/user/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setUser(data.user);
      } else {
        // This case might be rare now, but good to keep.
        if (token) toast.error(data.message);
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        // Only show an error toast if a token was present but was invalid.
        // This avoids showing an error on a fresh load without a token.
        if (token) {
          toast.error(error.response.data.message);
        }
      } else if (token) {
        // This handles network errors or cases where the server is unreachable.
        toast.error("Could not connect to the server. Please check your connection.");
      }
      // In any error scenario, clear user state and token.
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    } finally {
      setLoadingUser(false);
    }
  }, [token, setToken, setUser]); 

  const fetchUsersChats = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/chat/get");

      if (data.success) {
        setChats(data.chats);
        if (data.chats.length > 0) {
          setSelectedChat(data.chats[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  const createNewChat = useCallback(async () => {
    try {
      if (!user) return toast.error("Login to create a new chat");
      navigate("/");

      await axios.get("/api/chat/create");
      await fetchUsersChats();
    } catch (error) {
      toast.error(error.message);
    }
  }, [user, navigate, fetchUsersChats]);

  // Theme management
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Fetch user on token change
  useEffect(() => {
    setLoadingUser(true);
    fetchUser();
  }, [fetchUser]);

  // Fetch chats when user changes
  useEffect(() => {
    if (user) {
      fetchUsersChats();
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [user, fetchUsersChats]);

  const value = {
    navigate,
    user,
    setUser,
    fetchUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    createNewChat,
    loadingUser,
    fetchUsersChats,
    token,
    setToken,
    axios,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
