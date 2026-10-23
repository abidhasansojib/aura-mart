"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  Upload,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Flame,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { compressAndUploadImage } from "@/lib/image-upload";

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  imageUrl: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: string;
}

interface AdminProductsProps {
  products: AdminProduct[];
  currencySymbol?: string;
  onProductsUpdated: () => void;
}

const CATEGORY_SUGGESTIONS = [
  "General",
  "Apparel",
  "Accessories",
  "Electronics",
  "Home & Living",
  "Lifestyle",
  "Workstation",
  "Footwear",
];

export function AdminProducts({
  products,
  currencySymbol = "৳",
  onProductsUpdated,
}: AdminProductsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Image Uploading State
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "All" && p.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setCategory("General");
    setPrice("");
    setCompareAtPrice("");
    setStock("10");
    setDescription("");
    setImageUrl("");
    setIsFeatured(false);
    setIsActive(true);
    setFormError(null);
    setUploadFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: AdminProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPrice(String(p.price));
    setCompareAtPrice(p.compareAtPrice ? String(p.compareAtPrice) : "");
    setStock(String(p.stock));
    setDescription(p.description || "");
    setImageUrl(p.imageUrl || "");
    setIsFeatured(Boolean(p.isFeatured));
    setIsActive(Boolean(p.isActive));
    setFormError(null);
    setUploadFeedback(null);
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setUploadFeedback("Compressing photo to <150KB WebP & uploading...");
    try {
      const originalSizeKb = Math.round(file.size / 1024);
      const uploadedUrl = await compressAndUploadImage(file);
      setImageUrl(uploadedUrl);
      setUploadFeedback(`Photo compressed & ready! (Original: ${originalSizeKb} KB → <150 KB WebP)`);
    } catch (error) {
      console.error("Compression/Upload error:", error);
      setUploadFeedback("Failed to process image. You can paste an image URL instead.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setFormError("Please enter a valid selling price.");
      return;
    }

    setFormLoading(true);

    const payload = {
      name: name.trim(),
      category: category.trim() || "General",
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      stock: parseInt(stock, 10) || 0,
      description: description.trim(),
      imageUrl: imageUrl.trim() || "/placeholder-product.png",
      isFeatured,
      isActive,
    };

    try {
      if (editingProduct) {
        // PATCH
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update product");
        }
      } else {
        // POST
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create product");
        }
      }

      setIsModalOpen(false);
      onProductsUpdated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error saving product.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (p: AdminProduct) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      onProductsUpdated();
    } catch {
      alert("Failed to toggle product visibility");
    }
  };

  const handleDeleteProduct = async (p: AdminProduct) => {
    if (!confirm(`Are you sure you want to delete "${p.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      onProductsUpdated();
    } catch {
      alert("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Add Button, Category Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={openAddModal}
            className="w-full xs:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all min-h-[42px] shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>

          {/* Category Dropdown or Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-neutral-100 text-slate-600 hover:bg-neutral-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title or category..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[42px]"
          />
        </div>
      </div>

      {/* 2. Product Catalog Table / Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-md mx-auto space-y-3">
          <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No products match "${searchQuery}".`
              : "Click 'Add New Product' to start building your catalog."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-xs text-slate-600">
              <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Product</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Price</th>
                  <th className="py-3.5 px-4 font-bold">Stock</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= 5;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-gray-200">
                            <Image
                              src={p.imageUrl || "/placeholder-product.png"}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block line-clamp-1">
                              {p.name}
                            </span>
                            {p.isFeatured && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200 mt-0.5">
                                <Flame className="h-3 w-3 text-amber-500" />
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-neutral-100 text-slate-700 font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <div className="font-mono">
                          <span className="font-bold text-slate-900 block">
                            {formatPrice(p.price, currencySymbol)}
                          </span>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatPrice(p.compareAtPrice, currencySymbol)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-slate-500">
                            0 units (Out of Stock)
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {p.stock} units (Low Stock)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {p.stock} in stock
                          </span>
                        )}
                      </td>

                      {/* Active/Hidden Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-slate-500 border border-gray-200"
                          }`}
                        >
                          {p.isActive ? (
                            <>
                              <Eye className="h-3 w-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-5 xs:p-6 sm:p-8 shadow-2xl my-6 sm:my-8 space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Minimalist Slim Leather Wallet"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[42px]"
                />
              </div>

              {/* Category with suggestions */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Accessories"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[38px]"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 mr-1 self-center">Suggestions:</span>
                  {CATEGORY_SUGGESTIONS.map((sug) => (
                    <button
                      type="button"
                      key={sug}
                      onClick={() => setCategory(sug)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        category === sug
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-neutral-100 text-slate-600 border-gray-200 hover:bg-neutral-200"
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price, Compare Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Selling Price ({currencySymbol}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="650"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[38px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">
                    Compare Price (Discount)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="850"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[38px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="15"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[38px]"
                  />
                </div>
              </div>

              {/* Smart Image Uploader with WebP compression */}
              <div className="space-y-2 bg-neutral-50 p-4 rounded-2xl border border-gray-200">
                <span className="block font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Product Image Uploader (Automatic &lt;150KB WebP Compressor)
                </span>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* Image Preview */}
                  <div className="relative w-24 h-24 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt="Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full space-y-2">
                    <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 transition-colors">
                      <Upload className="h-4 w-4 text-emerald-600" />
                      <span>{isCompressing ? "Compressing WebP..." : "Choose Smartphone Photo (PNG/JPG)"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={isCompressing}
                        className="hidden"
                      />
                    </label>

                    {/* Or URL input */}
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Or paste direct image URL (Unsplash, Cloudinary, etc.)"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-slate-800 text-[11px] focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {uploadFeedback && (
                      <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{uploadFeedback}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail benefits, materials, sizing, and features..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Toggles: Featured & Active */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Featured on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Active / Visible in Store</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full xs:w-auto px-4 py-2.5 font-semibold text-slate-600 hover:text-slate-900 hover:bg-neutral-100 rounded-xl transition-colors min-h-[42px] text-center"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading || isCompressing}
                  className="w-full xs:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-md transition-colors min-h-[44px] flex items-center justify-center text-center"
                >
                  {formLoading ? "Saving Product..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
