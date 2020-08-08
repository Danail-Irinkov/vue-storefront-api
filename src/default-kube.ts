export default {
  kube_config: {
    'PROCC': {
      'API': 'http://procc-dash-api:8081',
      'URL': 'https://procc.co'
    },
    'vsf': {
      'host': 'http://vue-storefront',
      'port': 3000
    },
    'server': {
      'url': 'http://localhost:8080',
      'host': 'localhost',
      'port': 8080,
      'searchEngine': 'elasticsearch',
      'useOutputCacheTagging': false,
      'useOutputCache': false,
      'outputCacheDefaultTtl': 86400,
      'availableCacheTags': ['P', 'C', 'T', 'A', 'product', 'category', 'attribute', 'taxrule'],
      'invalidateCacheKey': 'aeSu7aip',
      'invalidateCacheForwarding': false,
      'invalidateCacheForwardUrl': 'http://vue-storefront:3000/invalidate?key=aeSu7aip&tag='
    },
    'redis': {
      'host': 'redis',
      'port': 6379,
      'db': 0
    },
    'elasticsearch': {
      'host': 'elastic5',
      'port': 9200,
      'protocol': 'http',
      'min_score': 0.01,
      'indices': [
        'vue_storefront_catalog'
      ],
      'indexTypes': [
        'product',
        'category',
        'cms_block',
        'cms_page',
        'attribute',
        'taxrule',
        'review'
      ],
      'apiVersion': '5.6'
    },
    'orders': {
      'useServerQueue': false
    },
    'catalog': {
      'excludeDisabledProducts': false
    },
    'kue': {},
    'availableStores': [
    ],
    'storeViews': {
      'multistore': true,
      'mapStoreUrlsFor': [
      ]
    },
    'authHashSecret': '__SECRET_CHANGE_ME__',
    'objHashSecret': '__SECRET_CHANGE_ME__',
    'cart': {
      'setConfigurableProductOptions': false
    },
    'tax': {
      'defaultCountry': 'PL',
      'defaultRegion': '',
      'calculateServerSide': true,
      'alwaysSyncPlatformPricesOver': false,
      'usePlatformTotals': true,
      'setConfigurableProductOptions': true,
      'sourcePriceIncludesTax': true,
      'deprecatedPriceFieldsSupport': true,
      'finalPriceIncludesTax': false,
      'userGroupId': null,
      'useOnlyDefaultUserGroupId': false
    },
    'review': {
      'defaultReviewStatus': 2
    },
    'bodyLimit': '100kb',
    'corsHeaders': [
      'Link'
    ],
    'platform': 'magento2procc',
    'registeredExtensions': [
      'procc',
      'mailchimp-subscribe',
      'example-magento-api',
      'cms-data',
      'mail-service',
      'example-processor',
      'elastic-stock'
    ],
    'extensions': {
      'mailchimp': {
        'listId': 'e06875a7e1',
        'apiKey': 'a9a3318ea7d30f5c5596bd4a78ae0985-us3',
        'apiUrl': 'https://us3.api.mailchimp.com/3.0',
        'userStatus': 'subscribed'
      },
      'mailService': {
        'transport': {
          'host': 'smtp.eu.mailgun.org',
          'port': 465,
          'secure': true,
          'user': 'support@procc.co',
          'pass': 'mailgun_pass_support'
        },
        'targetAddressWhitelist': [
          'support@procc.co'
        ],
        'secretString': '__SECRET_CHANGE_ME__'
      }
    },
    'magento2': {
      'imgUrl': 'https://storage.googleapis.com/procc/vendor/product/optimized',
      'assetPath': '/../var/magento2-sample-data/pub/media',
      'api': {
        'url': 'https://m2.procc.co/rest',
        'consumer2Key': 'ihwmlsyi8bu6wlptewr67s6bo6yi8cl4',
        'consumer2Secret': '8zom97k15z6nwertjxyvhwrre407kwdw',
        'access2Token': '4jooy23xlzfknrvgtpbldrtwjq6gybo6',
        'access2TokenSecret': '9tcgxt7ojxfgukups5nf7lgyfdrlagkb5'
      }
    },
    'magento2procc': {
      'imgUrl': 'https://storage.googleapis.com/procc/vendor/product/optimized',
      'assetPath': '/../var/magento2-sample-data/pub/media',
      'api': {
        'url': 'https://m2.procc.co/rest',
        'consumerKey': 'ihwmlsyi8bu6wlptewr67s6bo6yi8cl4',
        'consumerSecret': '8zom97k15z6nwertjxyvhwrre407kwdw',
        'accessToken': '4jooy23xlzfknrvgtpbldrtwjq6gybo6',
        'accessTokenSecret': '9tcgxt7ojxfgukups5nf7lgyfdrlagkb5'
      }
    },
    'imageable': {
      'maxListeners': 512,
      'imageSizeLimit': 1024,
      'whitelist': {
        'allowedHosts': [
          '.*divante.pl',
          '.*vuestorefront.io',
          '.*magento',
          '.*googleapis.com'
        ]
      },
      'cache': {
        'memory': 50,
        'files': 20,
        'items': 100
      },
      'concurrency': 0,
      'counters': {
        'queue': 2,
        'process': 4
      },
      'simd': true,
      'caching': {
        'active': false,
        'type': 'file',
        'file': {
          'path': '/tmp/vue-storefront-api'
        },
        'google-cloud-storage': {
          'libraryOptions': {},
          'bucket': '',
          'prefix': 'vue-storefront-api/image-cache'
        }
      },
      'action': {
        'type': 'local'
      }
    },
    'entities': {
      'category': {
        'includeFields': [
          'children_data',
          'id',
          'children_count',
          'sku',
          'name',
          'is_active',
          'parent_id',
          'level',
          'url_key',
          'brand_logo'
        ]
      },
      'attribute': {
        'includeFields': [
          'attribute_code',
          'id',
          'entity_type_id',
          'options',
          'default_value',
          'is_user_defined',
          'frontend_label',
          'attribute_id',
          'default_frontend_label',
          'is_visible_on_front',
          'is_visible',
          'is_comparable',
          'brand_logo'
        ]
      },
      'productList': {
        'sort': '',
        'includeFields': [
          'type_id',
          'sku',
          'product_links',
          'tax_class_id',
          'special_price',
          'special_to_date',
          'special_from_date',
          'name',
          'price',
          'priceInclTax',
          'originalPriceInclTax',
          'originalPrice',
          'specialPriceInclTax',
          'id',
          'image',
          'sale',
          'new',
          'url_key',
          'brand_logo'
        ],
        'excludeFields': [
          'configurable_children',
          'description',
          'configurable_options',
          'sgn'
        ]
      },
      'productListWithChildren': {
        'includeFields': [
          'type_id',
          'sku',
          'name',
          'tax_class_id',
          'special_price',
          'special_to_date',
          'special_from_date',
          'price',
          'priceInclTax',
          'originalPriceInclTax',
          'originalPrice',
          'specialPriceInclTax',
          'id',
          'image',
          'sale',
          'new',
          'configurable_children.image',
          'configurable_children.sku',
          'configurable_children.price',
          'configurable_children.special_price',
          'configurable_children.priceInclTax',
          'configurable_children.specialPriceInclTax',
          'configurable_children.originalPrice',
          'configurable_children.originalPriceInclTax',
          'configurable_children.color',
          'configurable_children.size',
          'product_links',
          'url_key',
          'brand_logo'
        ],
        'excludeFields': [
          'description',
          'sgn'
        ]
      },
      'product': {
        'excludeFields': [
          'updated_at',
          'created_at',
          'attribute_set_id',
          'status',
          'visibility',
          'tier_prices',
          'options_container',
          'msrp_display_actual_price_type',
          'has_options',
          'stock.manage_stock',
          'stock.use_config_min_qty',
          'stock.use_config_notify_stock_qty',
          'stock.stock_id',
          'stock.use_config_backorders',
          'stock.use_config_enable_qty_inc',
          'stock.enable_qty_increments',
          'stock.use_config_manage_stock',
          'stock.use_config_min_sale_qty',
          'stock.notify_stock_qty',
          'stock.use_config_max_sale_qty',
          'stock.use_config_max_sale_qty',
          'stock.qty_increments',
          'small_image'
        ],
        'includeFields': null,
        'filterFieldMapping': {
          'category.name': 'category.name.keyword'
        }
      }
    },
    'msi': {
      'enabled': false,
      'defaultStockId': 1
    },
    'usePriceTiers': false,
    'boost': {
      'name': 3,
      'category.name': 1,
      'short_description': 1,
      'description': 1,
      'sku': 1,
      'configurable_children.sku': 1
    }
  }
}
