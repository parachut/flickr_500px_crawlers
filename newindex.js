const Client = require("@elastic/elasticsearch").Client;
const elasti = new Client({
    node:
      'https://elastic:acNbgQRsl0OUznitAboYVss6@cb0a068fb8d64b3294ede898764e8f96.us-central1.gcp.cloud.es.io:9243',
  })

  const products = await Product.findAll({
    include: ['brand', 'category'],
  })

  await elasti.indices.delete({ index: 'products_popularity' })

  await elasti.indices.create(
    {
      index: 'products_popularity',
      body: {
        mappings: {
          properties: {
            id: { type: 'text' },
            name: { type: 'text' },
            mfr:{type: 'text'},
            aliases: { type: 'text' },
            brand: {
              type: 'object',
              properties: {
                name: { type: 'text' },
                id: { type: 'text' },
                slug: { type: 'text' },
              },
            },
            category: {
              type: 'object',
              properties: {
                name: { type: 'text' },
                id: { type: 'text' },
                slug: { type: 'text' },
              },
            },
            slug: { type: 'text' },
            popularity: { type: 'integer' },
            images: { type: 'text' },
            camera: { type: 'boolean' },
            lens: { type: 'boolean' },
            demand: { type: 'integer' },
            points: { type: 'integer' },
            stock: { type: 'integer' },
            createdAt: { type: 'date' },
            lastInventoryCreated: { type: 'date' },
          },
        },
      },
    },
    { ignore: [400] },
  )

  const dataset = products.map((product) => {
    let cats = null
    if (product.category) {
      cats = findBreadCrumbs(product.category)
    }

    return {
      id: product.id,
        name: product.name,
      mfr:product.mfr,
      camera: cats
        ? !!cats.find((category) => category.name.search('Cameras') !== -1)
        : false,
      lens: cats
        ? !!cats.find((category) => category.name.search('Lenses') !== -1)
        : false,
      category: product.category
        ? {
            name: product.category.name,
            id: product.category.id,
            slug: product.category.slug,
          }
        : null,
      brand: product.brand
        ? {
            name: product.brand.name,
            id: product.brand.id,
            slug: product.brand.slug,
          }
        : null,
      slug: product.slug,
      aliases: product.aliases
        ? product.aliases.split(',').map((a) => a.trim())
        : null,
      stock: product.stock,
      points: product.points,
      images: product.images,
      popularity: product.popularity,
      demand: product.demand,
      lastInventoryCreated: product.lastInventoryCreated,
    }
  })
