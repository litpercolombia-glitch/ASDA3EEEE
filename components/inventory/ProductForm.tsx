/**
 * ProductForm
 *
 * Formulario para crear/editar productos del inventario.
 * Incluye validación, campos dinámicos y soporte para variantes.
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Barcode,
  DollarSign,
  AlertTriangle,
  Save,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Tag,
  Weight,
  Box,
  Loader2,
} from 'lucide-react';
import type { Product, ProductCategory, UnitOfMeasure } from '@/types/inventory.types';

interface ProductFormProps {
  product?: Product | null;
  onSave: (product: Partial<Product>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CATEGORIES: ProductCategory[] = [
  'electronics',
  'clothing',
  'food',
  'health',
  'home',
  'sports',
  'toys',
  'other',
];

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  electronics: 'Electrónicos',
  clothing: 'Ropa y Accesorios',
  food: 'Alimentos',
  health: 'Salud y Belleza',
  home: 'Hogar',
  sports: 'Deportes',
  toys: 'Juguetes',
  other: 'Otros',
};

const UNITS: UnitOfMeasure[] = ['unit', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack'];

const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  unit: 'Unidad',
  kg: 'Kilogramos',
  g: 'Gramos',
  l: 'Litros',
  ml: 'Mililitros',
  m: 'Metros',
  cm: 'Centímetros',
  box: 'Caja',
  pack: 'Paquete',
};

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'other' as ProductCategory,
    brand: product?.brand || '',
    costPrice: product?.costPrice?.toString() || '',
    salePrice: product?.salePrice?.toString() || '',
    minStockLevel: product?.minStockLevel?.toString() || '10',
    reorderPoint: product?.reorderPoint?.toString() || '20',
    reorderQuantity: product?.reorderQuantity?.toString() || '50',
    unitOfMeasure: product?.unitOfMeasure || 'unit' as UnitOfMeasure,
    weight: product?.weight?.toString() || '',
    dimensions: {
      length: product?.dimensions?.length?.toString() || '',
      width: product?.dimensions?.width?.toString() || '',
      height: product?.dimensions?.height?.toString() || '',
    },
    tags: product?.tags?.join(', ') || '',
    imageUrl: product?.imageUrl || '',
    isActive: product?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(product?.tags || []);

  // Validación
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es requerido';
    } else if (!/^[A-Za-z0-9-_]+$/.test(formData.sku)) {
      newErrors.sku = 'SKU solo puede contener letras, números, guiones y guiones bajos';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.costPrice || parseFloat(formData.costPrice) < 0) {
      newErrors.costPrice = 'El precio de costo debe ser mayor o igual a 0';
    }

    if (!formData.salePrice || parseFloat(formData.salePrice) <= 0) {
      newErrors.salePrice = 'El precio de venta debe ser mayor a 0';
    }

    if (parseFloat(formData.salePrice) < parseFloat(formData.costPrice)) {
      newErrors.salePrice = 'El precio de venta no puede ser menor al costo';
    }

    if (parseInt(formData.minStockLevel) < 0) {
      newErrors.minStockLevel = 'El stock mínimo debe ser mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (name.startsWith('dimensions.')) {
      const dimKey = name.split('.')[1] as 'length' | 'width' | 'height';
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimKey]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Agregar tag
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  // Eliminar tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Guardar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const productData: Partial<Product> = {
      sku: formData.sku.toUpperCase(),
      barcode: formData.barcode || undefined,
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      brand: formData.brand || undefined,
      costPrice: parseFloat(formData.costPrice),
      salePrice: parseFloat(formData.salePrice),
      minStockLevel: parseInt(formData.minStockLevel) || 10,
      reorderPoint: parseInt(formData.reorderPoint) || 20,
      reorderQuantity: parseInt(formData.reorderQuantity) || 50,
      unitOfMeasure: formData.unitOfMeasure,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      dimensions: (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height)
        ? {
            length: parseFloat(formData.dimensions.length) || 0,
            width: parseFloat(formData.dimensions.width) || 0,
            height: parseFloat(formData.dimensions.height) || 0,
          }
        : undefined,
      tags,
      imageUrl: formData.imageUrl || undefined,
      isActive: formData.isActive,
    };

    if (isEditing && product) {
      productData.id = product.id;
    }

    await onSave(productData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Información básica */}
            <section>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Información Básica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    SKU *
                  </label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="PROD-001"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                        errors.sku
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2`}
                      disabled={isEditing}
                    />
                  </div>
                  {errors.sku && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.sku}
                    </p>
                  )}
                </div>

                {/* Código de barras */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="7501234567890"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nombre descriptivo del producto"
                    className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                      errors.name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Descripción detallada del producto..."
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Categoría
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Marca del producto"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Precios */}
            <section>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Precios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Precio de costo */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Precio de Costo *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                        errors.costPrice
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2`}
                    />
                  </div>
                  {errors.costPrice && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.costPrice}
                    </p>
                  )}
                </div>

                {/* Precio de venta */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Precio de Venta *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      name="salePrice"
                      value={formData.salePrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                        errors.salePrice
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2`}
                    />
                  </div>
                  {errors.salePrice && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.salePrice}
                    </p>
                  )}
                </div>
              </div>

              {/* Margen calculado */}
              {formData.costPrice && formData.salePrice && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Margen de ganancia:{' '}
                    <span className="font-semibold">
                      {(((parseFloat(formData.salePrice) - parseFloat(formData.costPrice)) / parseFloat(formData.costPrice)) * 100).toFixed(1)}%
                    </span>
                    {' '}(${(parseFloat(formData.salePrice) - parseFloat(formData.costPrice)).toFixed(2)} por unidad)
                  </p>
                </div>
              )}
            </section>

            {/* Control de stock */}
            <section>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Control de Stock
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="minStockLevel"
                    value={formData.minStockLevel}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Punto de Reorden
                  </label>
                  <input
                    type="number"
                    name="reorderPoint"
                    value={formData.reorderPoint}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cantidad de Reorden
                  </label>
                  <input
                    type="number"
                    name="reorderQuantity"
                    value={formData.reorderQuantity}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Medidas */}
            <section>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Medidas y Peso
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Unidad
                  </label>
                  <select
                    name="unitOfMeasure"
                    value={formData.unitOfMeasure}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>
                        {UNIT_LABELS[unit]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Largo (cm)
                  </label>
                  <input
                    type="number"
                    name="dimensions.length"
                    value={formData.dimensions.length}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Ancho (cm)
                  </label>
                  <input
                    type="number"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Alto (cm)
                  </label>
                  <input
                    type="number"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Tags */}
            <section>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Etiquetas
              </h3>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Agregar etiqueta..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Estado */}
            <section>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Producto Activo
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Los productos inactivos no aparecen en las listas y no se pueden vender
                  </p>
                </div>
              </label>
            </section>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Actualizar' : 'Crear'} Producto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
