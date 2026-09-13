import prisma from '../../lib/prisma.js';

function parsePositiveInt(value) {
	const number = Number(value);
	return Number.isInteger(number) && number > 0 ? number : null;
}

function getString(value, fieldName, required = false) {
	if (typeof value !== 'string') {
		return required ? { error: `${fieldName} is required` } : { value: undefined };
	}

	const trimmed = value.trim();
	if (required && !trimmed) {
		return { error: `${fieldName} is required` };
	}

	return { value: trimmed };
}

function parseInteger(value, fieldName, defaultValue) {
	if (value === undefined) return { value: defaultValue };
	const number = Number(value);
	return Number.isInteger(number) ? { value: number } : { error: `${fieldName} must be an integer` };
}

function parsePrice(value, fieldName) {
	const price = Number(value);
	return Number.isFinite(price) && price >= 0
		? { value: price }
		: { error: `${fieldName} must be a valid non-negative number` };
}

function parseImages(images) {
	if (images === undefined || images === null) return { value: null };
	if (!Array.isArray(images)) return { error: 'images must be an array' };

	for (const image of images) {
		if (!image || typeof image !== 'object' || typeof image.image_url !== 'string') {
			return { error: 'Each image must contain an image_url string' };
		}
		if (image.isPrimary !== undefined && ![0, 1, false, true].includes(image.isPrimary)) {
			return { error: 'image isPrimary must be 0, 1, true or false' };
		}
	}

	return { value: images };
}

function parseVariant(variant, index, requireId = false) {
	if (!variant || typeof variant !== 'object') {
		return { error: `variants[${index}] must be an object` };
	}

	const id = variant.variant_id === undefined || variant.variant_id === ''
		? undefined
		: parsePositiveInt(variant.variant_id);
	if (requireId && !id) return { error: `variants[${index}].variant_id must be a positive integer` };

	const name = getString(variant.name ?? variant.variant_name, `variants[${index}].name`, true);
	if (name.error) return name;
	const color = getString(variant.color, `variants[${index}].color`);
	if (color.error) return color;
	const description = getString(variant.description, `variants[${index}].description`);
	if (description.error) return description;
	const price = parsePrice(variant.price, `variants[${index}].price`);
	if (price.error) return price;
	const inStock = parseInteger(variant.inStock, `variants[${index}].inStock`, 0);
	if (inStock.error || inStock.value < 0) return { error: inStock.error || `variants[${index}].inStock cannot be negative` };
	const isPrimary = parseInteger(variant.isPrimary, `variants[${index}].isPrimary`, 0);
	if (isPrimary.error || ![0, 1].includes(isPrimary.value)) return { error: `variants[${index}].isPrimary must be 0 or 1` };
	const images = parseImages(variant.images);
	if (images.error) return images;

	return {
		value: {
			id,
			data: {
				name: name.value,
				color: color.value ?? null,
				price: price.value,
				inStock: inStock.value,
				description: description.value ?? null,
				isPrimary: isPrimary.value,
				...(images.value !== null && { images: images.value }),
			},
		},
	};
}

function parseProductBody(body, requireProductFields = true, includeVariants = true) {
	const name = getString(body.name, 'name', requireProductFields);
	if (name.error) return name;
	const description = getString(body.description, 'description');
	if (description.error) return description;
	const skuNo = getString(body.skuNo, 'skuNo', requireProductFields);
	if (skuNo.error) return skuNo;
	const categoryId = body.categoryId === undefined
		? { value: undefined }
		: { value: parsePositiveInt(body.categoryId) };
	if (requireProductFields && !categoryId.value) return { error: 'categoryId must be a positive integer' };
	if (body.categoryId !== undefined && !categoryId.value) return { error: 'categoryId must be a positive integer' };
	const inStock = parseInteger(body.inStock, 'inStock', 0);
	if (inStock.error || inStock.value < 0) return { error: inStock.error || 'inStock cannot be negative' };

	const parsedVariants = [];
	if (includeVariants) {
		const variants = body.variants === undefined ? [] : body.variants;
		if (!Array.isArray(variants)) return { error: 'variants must be an array' };
		for (let index = 0; index < variants.length; index += 1) {
			const parsed = parseVariant(variants[index], index);
			if (parsed.error) return parsed;
			parsedVariants.push(parsed.value);
		}
	}

	return {
		value: {
			product: {
				...(name.value !== undefined && { name: name.value }),
				...(description.value !== undefined && { description: description.value || null }),
				...(categoryId.value !== undefined && { categoryId: categoryId.value }),
				...(skuNo.value !== undefined && { skuNo: skuNo.value }),
				...(inStock.value !== undefined && { inStock: inStock.value }),
			},
			variants: parsedVariants,
		},
	};
}

const productInclude = {
	category: true,
	variants: true,
};

async function listProducts(req, res) {
	try {
		const products = await prisma.product.findMany({
			include: productInclude,
			orderBy: { createdAt: 'desc' },
		});
		return res.json({ products });
	} catch (error) {
		console.error('List products error:', error);
		return res.status(500).json({ message: 'Unable to fetch products' });
	}
}

async function getProduct(req, res) {
	const id = parsePositiveInt(req.params.id);
	if (!id) return res.status(400).json({ message: 'Product ID must be a positive integer' });

	try {
		const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
		if (!product) return res.status(404).json({ message: 'Product not found' });
		return res.json({ product });
	} catch (error) {
		console.error('Get product error:', error);
		return res.status(500).json({ message: 'Unable to fetch product' });
	}
}

async function createProduct(req, res) {
	const parsed = parseProductBody(req.body);
	if (parsed.error) return res.status(400).json({ message: parsed.error });

	try {
		const product = await prisma.product.create({
			data: {
				...parsed.value.product,
				variants: { create: parsed.value.variants.map((variant) => variant.data) },
			},
			include: productInclude,
		});
		return res.status(201).json({ message: 'Product created successfully', product });
	} catch (error) {
		if (error.code === 'P2002') return res.status(409).json({ message: 'SKU already exists' });
		if (error.code === 'P2003') return res.status(400).json({ message: 'Category not found' });
		console.error('Create product error:', error);
		return res.status(500).json({ message: 'Unable to create product' });
	}
}

async function addProduct(req, res) {
	const parsed = parseProductBody(req.body, true, false);
	if (parsed.error) return res.status(400).json({ message: parsed.error });
	if (req.body.variants !== undefined) {
		return res.status(400).json({ message: 'variants are not accepted by this endpoint' });
	}

	try {
		const product = await prisma.product.create({
			data: parsed.value.product,
			include: productInclude,
		});
		return res.status(201).json({ message: 'Product added successfully', product });
	} catch (error) {
		if (error.code === 'P2002') return res.status(409).json({ message: 'SKU already exists' });
		if (error.code === 'P2003') return res.status(400).json({ message: 'Category not found' });
		console.error('Add product error:', error);
		return res.status(500).json({ message: 'Unable to add product' });
	}
}

async function updateProduct(req, res) {
	const id = parsePositiveInt(req.params.id);
	if (!id) return res.status(400).json({ message: 'Product ID must be a positive integer' });
	const parsed = parseProductBody(req.body, false);
	if (parsed.error) return res.status(400).json({ message: parsed.error });
	if (Object.keys(parsed.value.product).length === 0 && parsed.value.variants.length === 0) {
		return res.status(400).json({ message: 'Provide product fields or variants to update' });
	}

	try {
		const product = await prisma.$transaction(async (transaction) => {
			if (Object.keys(parsed.value.product).length > 0) {
				await transaction.product.update({ where: { id }, data: parsed.value.product });
			}

			for (const variant of parsed.value.variants) {
				if (variant.id) {
					await transaction.productVariant.update({
					where: { id: variant.id },
					data: variant.data,
				});
				} else {
					await transaction.productVariant.create({
						data: { ...variant.data, productId: id },
					});
				}
			}

			return transaction.product.findUnique({ where: { id }, include: productInclude });
		});
		return res.json({ message: 'Product updated successfully', product });
	} catch (error) {
		if (error.code === 'P2002') return res.status(409).json({ message: 'SKU already exists' });
		if (error.code === 'P2025') return res.status(404).json({ message: 'Product or variant not found' });
		if (error.code === 'P2003') return res.status(400).json({ message: 'Category not found' });
		console.error('Update product error:', error);
		return res.status(500).json({ message: 'Unable to update product' });
	}
}

async function updateProductOnly(req, res) {
	const id = parsePositiveInt(req.params.id);
	if (!id) return res.status(400).json({ message: 'Product ID must be a positive integer' });
	if (req.body.variants !== undefined) {
		return res.status(400).json({ message: 'variants are not accepted by this endpoint' });
	}

	const parsed = parseProductBody(req.body, false, false);
	if (parsed.error) return res.status(400).json({ message: parsed.error });
	if (Object.keys(parsed.value.product).length === 0) {
		return res.status(400).json({ message: 'Provide product fields to update' });
	}

	try {
		const product = await prisma.product.update({
			where: { id },
			data: parsed.value.product,
			include: productInclude,
		});
		return res.json({ message: 'Product updated successfully', product });
	} catch (error) {
		if (error.code === 'P2002') return res.status(409).json({ message: 'SKU already exists' });
		if (error.code === 'P2025') return res.status(404).json({ message: 'Product not found' });
		if (error.code === 'P2003') return res.status(400).json({ message: 'Category not found' });
		console.error('Update product error:', error);
		return res.status(500).json({ message: 'Unable to update product' });
	}
}

async function addProductVariant(req, res) {
	const productId = parsePositiveInt(req.params.productId ?? req.body.productId);
	if (!productId) return res.status(400).json({ message: 'Product ID must be a positive integer' });

	const parsed = parseVariant(req.body, 0);
	if (parsed.error) return res.status(400).json({ message: parsed.error.replace('variants[0].', '') });

	try {
		const variant = await prisma.productVariant.create({
			data: { ...parsed.value.data, productId },
			include: { product: true },
		});
		return res.status(201).json({ message: 'Product variant added successfully', variant });
	} catch (error) {
		if (error.code === 'P2003') return res.status(404).json({ message: 'Product not found' });
		console.error('Add product variant error:', error);
		return res.status(500).json({ message: 'Unable to add product variant' });
	}
}

async function getProductVariant(req, res) {
	const id = parsePositiveInt(req.params.variantId);
	if (!id) return res.status(400).json({ message: 'Variant ID must be a positive integer' });

	try {
		const variant = await prisma.productVariant.findUnique({
			where: { id },
			include: { product: true },
		});
		if (!variant) return res.status(404).json({ message: 'Product variant not found' });
		return res.json({ variant });
	} catch (error) {
		console.error('Get product variant error:', error);
		return res.status(500).json({ message: 'Unable to fetch product variant' });
	}
}

async function getProductVariantByProduct(req, res) {
	const productId = parsePositiveInt(req.params.productId);
	const variantId = parsePositiveInt(req.params.variantId);
	if (!productId) return res.status(400).json({ message: 'Product ID must be a positive integer' });
	if (!variantId) return res.status(400).json({ message: 'Variant ID must be a positive integer' });

	try {
		const variant = await prisma.productVariant.findFirst({
			where: { id: variantId, productId },
			include: { product: true },
		});
		if (!variant) return res.status(404).json({ message: 'Product variant not found for this product' });
		return res.json({ variant });
	} catch (error) {
		console.error('Get product variant by product error:', error);
		return res.status(500).json({ message: 'Unable to fetch product variant' });
	}
}

async function listProductVariantsByProduct(req, res) {
	const productIdValue = req.params.productId ?? req.query.productId;
	const productId = productIdValue === undefined ? undefined : parsePositiveInt(productIdValue);
	if (productIdValue !== undefined && !productId) {
		return res.status(400).json({ message: 'Product ID must be a positive integer' });
	}

	try {
		if (productId) {
			const product = await prisma.product.findUnique({ where: { id: productId } });
			if (!product) return res.status(404).json({ message: 'Product not found' });
		}

		const variants = await prisma.productVariant.findMany({
			where: productId ? { productId } : undefined,
			include: { product: true },
			orderBy: { createdAt: 'desc' },
		});

		return res.json({
			...(productId && { productId }),
			variants,
		});
	} catch (error) {
		console.error('List all product variants error:', error);
		return res.status(500).json({ message: 'Unable to fetch product variants' });
	}
}

async function updateProductVariant(req, res) {
	const id = parsePositiveInt(req.params.variantId);
	if (!id) return res.status(400).json({ message: 'Variant ID must be a positive integer' });

	const data = {};
	const variantName = req.body.name ?? req.body.variant_name;
	if (variantName !== undefined) {
		const name = getString(variantName, 'name', true);
		if (name.error) return res.status(400).json({ message: name.error });
		data.name = name.value;
	}
	if (req.body.color !== undefined) {
		if (req.body.color !== null && typeof req.body.color !== 'string') {
			return res.status(400).json({ message: 'color must be a string or null' });
		}
		data.color = req.body.color === null ? null : req.body.color.trim();
	}
	if (req.body.description !== undefined) {
		if (req.body.description !== null && typeof req.body.description !== 'string') {
			return res.status(400).json({ message: 'description must be a string or null' });
		}
		data.description = req.body.description === null ? null : req.body.description.trim();
	}
	if (req.body.price !== undefined) {
		const price = parsePrice(req.body.price, 'price');
		if (price.error) return res.status(400).json({ message: price.error });
		data.price = price.value;
	}
	if (req.body.inStock !== undefined) {
		const inStock = parseInteger(req.body.inStock, 'inStock');
		if (inStock.error || inStock.value < 0) return res.status(400).json({ message: inStock.error || 'inStock cannot be negative' });
		data.inStock = inStock.value;
	}
	if (req.body.isPrimary !== undefined) {
		const isPrimary = parseInteger(req.body.isPrimary, 'isPrimary');
		if (isPrimary.error || ![0, 1].includes(isPrimary.value)) return res.status(400).json({ message: 'isPrimary must be 0 or 1' });
		data.isPrimary = isPrimary.value;
	}
	if (req.body.images !== undefined) {
		const images = parseImages(req.body.images);
		if (images.error) return res.status(400).json({ message: images.error });
		data.images = images.value;
	}
	if (Object.keys(data).length === 0) return res.status(400).json({ message: 'Provide variant fields to update' });

	try {
		const variant = await prisma.productVariant.update({
			where: { id },
			data,
			include: { product: true },
		});
		return res.json({ message: 'Product variant updated successfully', variant });
	} catch (error) {
		if (error.code === 'P2025') return res.status(404).json({ message: 'Product variant not found' });
		console.error('Update product variant error:', error);
		return res.status(500).json({ message: 'Unable to update product variant' });
	}
}

async function updateProductVariantByProduct(req, res) {
	const productId = parsePositiveInt(req.params.productId);
	const variantId = parsePositiveInt(req.params.variantId);
	if (!productId) return res.status(400).json({ message: 'Product ID must be a positive integer' });
	if (!variantId) return res.status(400).json({ message: 'Variant ID must be a positive integer' });

	try {
		const variant = await prisma.productVariant.findFirst({
			where: { id: variantId, productId },
		});
		if (!variant) return res.status(404).json({ message: 'Product variant not found for this product' });

		req.params.variantId = String(variantId);
		return updateProductVariant(req, res);
	} catch (error) {
		console.error('Validate product variant ownership error:', error);
		return res.status(500).json({ message: 'Unable to update product variant' });
	}
}

async function deleteProductVariant(req, res) {
	const id = parsePositiveInt(req.params.variantId);
	if (!id) return res.status(400).json({ message: 'Variant ID must be a positive integer' });

	try {
		await prisma.productVariant.delete({ where: { id } });
		return res.json({ message: 'Product variant deleted successfully' });
	} catch (error) {
		if (error.code === 'P2025') return res.status(404).json({ message: 'Product variant not found' });
		if (error.code === 'P2003') return res.status(409).json({ message: 'Cannot delete variant with related orders or cart items' });
		console.error('Delete product variant error:', error);
		return res.status(500).json({ message: 'Unable to delete product variant' });
	}
}

async function deleteProduct(req, res) {
	const id = parsePositiveInt(req.params.id);
	if (!id) return res.status(400).json({ message: 'Product ID must be a positive integer' });

	try {
		await prisma.product.delete({ where: { id } });
		return res.json({ message: 'Product deleted successfully' });
	} catch (error) {
		if (error.code === 'P2025') return res.status(404).json({ message: 'Product not found' });
		if (error.code === 'P2003') return res.status(409).json({ message: 'Cannot delete product with related orders' });
		console.error('Delete product error:', error);
		return res.status(500).json({ message: 'Unable to delete product' });
	}
}

function uploadProductImages(req, res) {
	console.log('Uploaded files:', req.files?.[0], req.body);
	return res.status(201).json({
		message: 'Product images uploaded successfully',
		imageUrls: req.body?.imageUrls || [],
	});
}

export {
	listProducts,
	getProduct,
	createProduct,
	addProduct,
	updateProduct,
	updateProductOnly,
	addProductVariant,
	getProductVariant,
	getProductVariantByProduct,
	listProductVariantsByProduct,
	updateProductVariant,
	updateProductVariantByProduct,
	deleteProductVariant,
	deleteProduct,
	uploadProductImages,
};
