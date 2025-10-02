"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Edit,
  Trash2,
  Shield,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users as UsersIcon,
  Filter,
  Eye,
  MoreVertical,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { isNewItem } from "@/lib/utils";
import { toast } from "react-toastify";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "",
    role_id: "",
    phone: "",
    address: "",
    profile_photo: "",
    status: "active",
    emailVerified: false,
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users");
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
        toast.success(result.message);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      console.log("🔍 Loading roles from /api/roles...");
      const response = await fetch("/api/roles");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("📋 Roles API response:", result);

      if (result.success && result.data && Array.isArray(result.data)) {
        // Clean up role names (remove whitespace/newlines)
        const cleanedRoles = result.data.map((role) => ({
          ...role,
          rolename: role.rolename?.trim() || role.rolename,
        }));

        setRoles(cleanedRoles);
        console.log("✅ Roles loaded successfully:", cleanedRoles);
        console.log("✅ Total roles:", cleanedRoles.length);
      } else {
        console.error("❌ Invalid roles response:", result);
        toast.error("Failed to load roles: Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error loading roles:", error);
      toast.error("Error loading roles: " + error.message);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${user.first_name} ${user.last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const getInitials = (user) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name?.[0] || ""}${
        user.last_name?.[0] || ""
      }`.toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleColor = (role) => {
    const roleStr = role?.toLowerCase() || "";

    if (roleStr.includes("admin")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    } else if (roleStr.includes("manager") || roleStr.includes("supervisor")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else if (roleStr.includes("staff") || roleStr.includes("employee")) {
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    } else if (roleStr.includes("owner") || roleStr.includes("customer")) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    } else if (
      roleStr.includes("sales") ||
      roleStr.includes("representative")
    ) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (roleStr.includes("service")) {
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    } else {
      return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getRoleName = (role) => {
    // Find the role in the roles array to get the proper display name
    const roleData = roles.find(
      (r) => r.rolename?.toLowerCase() === role?.toLowerCase()
    );
    if (roleData) {
      return roleData.rolename;
    }

    // Fallback to formatting the role string
    if (!role) return "User";

    // Capitalize first letter of each word
    return role
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const uniqueRoles = [...new Set(users.map((u) => u.role))].filter(Boolean);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "",
      role_id: "",
      phone: "",
      address: "",
      profile_photo: "",
      status: "active",
      emailVerified: false,
    });
    setPhotoPreview(null);
    setSelectedPhotoFile(null);
    setEditingUser(null);
    setIsEditMode(false);
  };

  const handleAddUser = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsEditMode(true);
    setFormData({
      email: user.email,
      password: "", // Don't populate password for edit
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role || "",
      role_id: user.role_id || "",
      phone: user.phone || "",
      address: user.address || "",
      profile_photo: user.profile_photo || "",
      status: user.status || "active",
      emailVerified: user.email_verified || false,
    });
    setPhotoPreview(user.profile_photo || null);
    setIsModalOpen(true);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Store the file and create preview
    setSelectedPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const uploadPhoto = async (file) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("profile", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const result = await response.json();

      if (response.ok) {
        return result.url;
      } else {
        throw new Error(result.error || "Failed to upload photo");
      }
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profile_photo: "" }));
    setPhotoPreview(null);
    setSelectedPhotoFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let photoUrl = formData.profile_photo;

      // Upload photo if a new file was selected
      if (selectedPhotoFile) {
        setUploadingPhoto(true);
        try {
          photoUrl = await uploadPhoto(selectedPhotoFile);
          console.log("✅ Photo uploaded:", photoUrl);
        } catch (uploadError) {
          toast.error("Failed to upload photo: " + uploadError.message);
          setIsSubmitting(false);
          setUploadingPhoto(false);
          return;
        } finally {
          setUploadingPhoto(false);
        }
      }

      // Prepare user data with photo URL
      const userData = {
        ...formData,
        profile_photo: photoUrl,
      };

      if (isEditMode) {
        // Update user
        const response = await fetch("/api/users", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: editingUser.id,
            ...userData,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success("User updated successfully!");
          setIsModalOpen(false);
          resetForm();
          loadUsers(); // Reload users list
        } else {
          toast.error(result.message || "Failed to update user");
        }
      } else {
        // Create new user
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        const result = await response.json();

        if (result.success) {
          toast.success("User created successfully!");
          setIsModalOpen(false);
          resetForm();
          loadUsers(); // Reload users list
        } else {
          toast.error(result.message || "Failed to create user");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users?userId=${deletingUser.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("User deleted successfully!");
        setIsDeleteModalOpen(false);
        setDeletingUser(null);
        loadUsers(); // Reload users list
      } else {
        toast.error(result.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <UsersIcon className="w-10 h-10 text-blue-600" />
              System Users
            </h1>
            <p className="text-lg text-slate-600">
              Manage authentication and user accounts ({filteredUsers.length}{" "}
              total)
            </p>
          </div>
          <Button
            onClick={handleAddUser}
            className="bg-gradient-to-r from-red-400 to-red-500 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add User
          </Button>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-400"
              />
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Filter className="w-4 h-4 text-slate-500" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleFilter("")}
                className={
                  roleFilter === "" ? "bg-blue-50 border-blue-300" : ""
                }
              >
                All Roles
              </Button>
              {uniqueRoles.map((role) => (
                <Button
                  key={role}
                  variant="outline"
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                  className={
                    roleFilter === role ? "bg-blue-50 border-blue-300" : ""
                  }
                >
                  {getRoleName(role)}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {users.length}
                  </p>
                </div>
                <UsersIcon className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {users.filter((u) => u.status === "active").length}
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Verified Emails
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {users.filter((u) => u.email_verified).length}
                  </p>
                </div>
                <Mail className="w-10 h-10 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">
                    New Today
                  </p>
                  <p className="text-3xl font-bold text-amber-900">
                    {users.filter((u) => isNewItem(u.created_at)).length}
                  </p>
                </div>
                <Sparkles className="w-10 h-10 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-8 space-y-4">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-200 animate-pulse rounded-lg"
                  />
                ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No users found
              </h3>
              <p className="text-slate-600">
                {searchTerm || roleFilter
                  ? "Try adjusting your filters"
                  : "No users have been registered yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Verified
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Last Sign In
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-blue-50/50 transition-colors group"
                    >
                      {/* User Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200">
                            {user.profile_photo ? (
                              <img
                                src={user.profile_photo}
                                alt={`${user.first_name} ${user.last_name}`}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <AvatarFallback
                              className="text-blue-700 font-semibold text-sm"
                              style={{
                                display: user.profile_photo ? "none" : "flex",
                              }}
                            >
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.email.split("@")[0]}
                              </p>
                              {isNewItem(user.created_at) && (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md animate-pulse px-1.5 py-0">
                                  <Sparkles className="w-3 h-3" />
                                </Badge>
                              )}
                            </div>
                            {user.is_staff && user.branch_info?.branch_name && (
                              <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                                <Shield className="w-3 h-3" />
                                {user.branch_info.branch_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {user.email}
                            </span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={`${getRoleColor(
                            user.role
                          )} border font-medium`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {getRoleName(user.role)}
                        </Badge>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={`${getStatusColor(
                            user.status
                          )} border font-medium capitalize`}
                        >
                          {user.status}
                        </Badge>
                      </td>

                      {/* Verified Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center">
                          {user.email_verified ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </td>

                      {/* Last Sign In Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.last_sign_in_at ? (
                          <div className="text-sm text-slate-600">
                            <div>
                              {format(
                                new Date(user.last_sign_in_at),
                                "MMM d, yyyy"
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {format(new Date(user.last_sign_in_at), "h:mm a")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Never</span>
                        )}
                      </td>

                      {/* Created Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
                          <div>
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(user.created_at), "h:mm a")}
                          </div>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() =>
                              toast.info("View user details coming soon")
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Items per page */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Show</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) =>
                          handleItemsPerPageChange(e.target.value)
                        }
                        className="px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <span className="text-sm text-slate-600">per page</span>
                    </div>

                    {/* Page info */}
                    <div className="text-sm text-slate-600">
                      Showing{" "}
                      <span className="font-semibold text-slate-900">
                        {startIndex + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-900">
                        {Math.min(endIndex, filteredUsers.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-900">
                        {filteredUsers.length}
                      </span>{" "}
                      users
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </Button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            // Show first page, last page, current page, and 2 pages around current
                            return (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1)
                            );
                          })
                          .map((page, index, array) => (
                            <div key={page} className="flex items-center">
                              {/* Add ellipsis if there's a gap */}
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-slate-400">...</span>
                              )}
                              <Button
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={
                                  currentPage === page
                                    ? "bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600"
                                    : ""
                                }
                              >
                                {page}
                              </Button>
                            </div>
                          ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Add/Edit User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-red-400 to-red-500 px-6 py-4 text-white rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <UsersIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {isEditMode ? "Edit User" : "Add New User"}
                      </h3>
                      <p className="text-red-100 text-sm mt-1">
                        {isEditMode
                          ? "Update user information"
                          : "Create a new user account"}
                      </p>
                    </div>
                  </div>
                  <button
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Profile Photo */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                    Profile Photo
                  </h4>

                  <div className="flex items-center gap-6">
                    {/* Photo Preview */}
                    <div className="relative">
                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Profile preview"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-4 border-white shadow-lg">
                          <UsersIcon className="w-12 h-12 text-blue-600" />
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Plus className="w-4 h-4" />
                          {photoPreview ? "Change Photo" : "Select Photo"}
                        </div>
                      </label>
                      <p className="text-xs text-slate-500 mt-2">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        First Name *
                      </label>
                      <Input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="Enter first name"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Last Name *
                      </label>
                      <Input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Enter last name"
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    Account Information
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="user@example.com"
                      required
                      disabled={isEditMode}
                      className="w-full"
                    />
                    {isEditMode && (
                      <p className="text-xs text-slate-500 mt-1">
                        Email cannot be changed
                      </p>
                    )}
                  </div>

                  {!isEditMode && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password *
                      </label>
                      <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password"
                        required={!isEditMode}
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Minimum 6 characters
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Role *
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        disabled={roles.length === 0}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {roles.length === 0
                            ? "Loading roles..."
                            : "Select a role"}
                        </option>
                        {roles.map((role) => {
                          // Use 'rolename' as the primary column for role name
                          const roleName = role.rolename?.trim();
                          const roleDescription = role.description?.trim();
                          const displayText = roleDescription
                            ? `${roleName} - ${roleDescription}`
                            : roleName;

                          return (
                            <option key={role.role_id} value={roleName}>
                              {displayText}
                            </option>
                          );
                        })}
                      </select>
                      {roles.length === 0 ? (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <span className="inline-block w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                          Loading roles from database...
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {roles.length} role(s) loaded successfully
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    Contact Information
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+63 912 345 6789"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter address"
                      rows="3"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-red-400 to-red-500 hover:from-blue-700 hover:to-blue-800 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        {uploadingPhoto
                          ? "Uploading photo..."
                          : isEditMode
                          ? "Updating..."
                          : "Creating..."}
                      </>
                    ) : (
                      <>
                        {isEditMode ? (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            Update User
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create User
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Delete User</h3>
                      <p className="text-red-100 text-sm mt-1">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  <button
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeletingUser(null);
                    }}
                    disabled={isSubmitting}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    Are you sure you want to delete this user?
                  </h4>
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200">
                        <AvatarFallback className="text-blue-700 font-semibold">
                          {getInitials(deletingUser)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-slate-900">
                          {deletingUser.first_name && deletingUser.last_name
                            ? `${deletingUser.first_name} ${deletingUser.last_name}`
                            : deletingUser.email.split("@")[0]}
                        </p>
                        <p className="text-sm text-slate-600">
                          {deletingUser.email}
                        </p>
                      </div>
                    </div>
                    {deletingUser.role && (
                      <Badge
                        className={`${getRoleColor(
                          deletingUser.role
                        )} border font-medium`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleName(deletingUser.role)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600">
                    This will permanently delete the user account and all
                    associated data. This action cannot be reversed.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeletingUser(null);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
