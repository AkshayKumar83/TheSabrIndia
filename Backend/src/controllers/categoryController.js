import prisma from '../../lib/prisma.js';

function parseCategoryId(value) {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
}

function parseCategoryStatus(value) {
	const status = Number(value);
	return Number.isInteger(status) ? status : null;
}

function getCategoryName(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function getOptionalString(value) {
	if (value === null) return null;
	return typeof value === 'string' ? value.trim() : undefined;
}

async function listCategories(req, res) {
	try {
		const categories = await prisma.category.findMany({
			orderBy: { createdAt: 'desc' },
		});

		return res.json({ categories });
	} catch (error) {
		console.error('List categories error:', error);
		return res.status(500).json({ message: 'Unable to fetch categories' });
	}
}

async function listCategoriesByStatus(req, res) {
	const status = parseCategoryStatus(req.params.status);
	if (status === null) {
		return res.status(400).json({ message: 'Category status must be an integer' });
	}

	try {
		const categories = await prisma.category.findMany({
			where: { status },
			orderBy: { createdAt: 'desc' },
		});

		return res.json({ categories });
	} catch (error) {
		console.error('List categories by status error:', error);
		return res.status(500).json({ message: 'Unable to fetch categories by status' });
	}
}

async function getCategory(req, res) {
	const id = parseCategoryId(req.params.id);
	if (!id) {
		return res.status(400).json({ message: 'Category ID must be a positive integer' });
	}

	try {
		const category = await prisma.category.findUnique({ where: { id } });
		if (!category) {
			return res.status(404).json({ message: 'Category not found' });
		}

		return res.json({ category });
	} catch (error) {
		console.error('Get category error:', error);
		return res.status(500).json({ message: 'Unable to fetch category' });
	}
}

async function createCategory(req, res) {
	const name = getCategoryName(req.body.name);
	const description = getOptionalString(req.body.description);
	const imageUrl = getOptionalString(req.body.imageUrl);
	const status = req.body.status === undefined ? 1 : Number(req.body.status);

	if (!name) {
		return res.status(400).json({ message: 'name is required' });
	}
	if (!Number.isInteger(status)) {
		return res.status(400).json({ message: 'status must be an integer' });
	}
	if ((Object.hasOwn(req.body, 'description') && description === undefined)
		|| (Object.hasOwn(req.body, 'imageUrl') && imageUrl === undefined)) {
		return res.status(400).json({ message: 'description and imageUrl must be strings or null' });
	}

	try {
		const category = await prisma.category.create({
			data: { name, description, imageUrl, status },
		});
		return res.status(201).json({ message: 'Category created successfully', category });
	} catch (error) {
		if (error.code === 'P2002') {
			return res.status(409).json({ message: 'Category name already exists' });
		}

		console.error('Create category error:', error);
		return res.status(500).json({ message: 'Unable to create category' });
	}
}

async function updateCategory(req, res) {
	const id = parseCategoryId(req.params.id);
	const name = req.body.name === undefined ? undefined : getCategoryName(req.body.name);
	const description = req.body.description === undefined ? undefined : getOptionalString(req.body.description);
	const imageUrl = req.body.imageUrl === undefined ? undefined : getOptionalString(req.body.imageUrl);
	const status = req.body.status === undefined ? undefined : Number(req.body.status);

	if (!id) {
		return res.status(400).json({ message: 'Category ID must be a positive integer' });
	}
	if (name === '' || (status !== undefined && !Number.isInteger(status))) {
		return res.status(400).json({ message: 'name must be non-empty and status must be an integer' });
	}
	if (description === undefined && req.body.description !== undefined) {
		return res.status(400).json({ message: 'description must be a string or null' });
	}
	if (imageUrl === undefined && req.body.imageUrl !== undefined) {
		return res.status(400).json({ message: 'imageUrl must be a string or null' });
	}
	if (name === undefined && description === undefined && imageUrl === undefined && status === undefined) {
		return res.status(400).json({ message: 'Provide name, description, imageUrl or status to update' });
	}

	const data = {};
	if (name !== undefined) data.name = name;
	if (description !== undefined) data.description = description;
	if (imageUrl !== undefined) data.imageUrl = imageUrl;
	if (status !== undefined) data.status = status;

	try {
		const category = await prisma.category.update({ where: { id }, data });
		return res.json({ message: 'Category updated successfully', category });
	} catch (error) {
		if (error.code === 'P2002') {
			return res.status(409).json({ message: 'Category name already exists' });
		}
		if (error.code === 'P2025') {
			return res.status(404).json({ message: 'Category not found' });
		}

		console.error('Update category error:', error);
		return res.status(500).json({ message: 'Unable to update category' });
	}
}

async function deleteCategory(req, res) {
	const id = parseCategoryId(req.params.id);
	if (!id) {
		return res.status(400).json({ message: 'Category ID must be a positive integer' });
	}

	try {
		await prisma.category.delete({ where: { id } });
		return res.json({ message: 'Category deleted successfully' });
	} catch (error) {
		if (error.code === 'P2025') {
			return res.status(404).json({ message: 'Category not found' });
		}
		if (error.code === 'P2003') {
			return res.status(409).json({ message: 'Cannot delete a category with products' });
		}

		console.error('Delete category error:', error);
		return res.status(500).json({ message: 'Unable to delete category' });
	}
}

export {
	listCategories,
	listCategoriesByStatus,
	getCategory,
	createCategory,
	updateCategory,
	deleteCategory,
};
