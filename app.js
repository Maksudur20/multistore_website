const state = {
    products: [],
    categories: [],
    cart: [],
    currentPage: 'home',
    selectedProductId: null,
    selectedCategory: null,
    loading: false,
    error: null
};

// DOM Elements
const app = document.getElementById('app');
const navLinks = document.querySelectorAll('.nav-links a');

// Initialize the application
async function init() {
    // Add event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateTo(page);
        });
    });

    document.querySelector('.logo').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('home');
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const pageFromUrl = window.location.hash.slice(1) || 'home';
        renderPage(pageFromUrl);
    });

    // Check URL for initial page
    const initialPage = window.location.hash.slice(1) || 'home';
    navigateTo(initialPage, true);

    // Fetch initial data
    await fetchProducts();
    await fetchCategories();
}

document.getElementById('nav-toggle').addEventListener('click', function () {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('active');
    document.body.classList.toggle('menu-open');

    // Change the button icon
    if (navLinks.classList.contains('active')) {
        this.innerHTML = 'X'; // X symbol
    } else {
        this.innerHTML = '&#9776;'; // Hamburger menu symbol
    }
});

// Close menu when clicking navigation links on mobile
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            document.getElementById('nav-links').classList.remove('active');
            document.body.classList.remove('menu-open');
            document.getElementById('nav-toggle').innerHTML = '&#9776;';
        }
    });
});

// Close menu when clicking outside on mobile
document.addEventListener('click', (e) => {
    const navLinks = document.getElementById('nav-links');
    const navToggle = document.getElementById('nav-toggle');

    if (window.innerWidth <= 768 &&
        navLinks.classList.contains('active') &&
        !navLinks.contains(e.target) &&
        e.target !== navToggle) {
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
        navToggle.innerHTML = '&#9776;';
    }
});

// Add event listeners to footer links
document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        navigateTo(page);
    });
});

// Navigation function
function navigateTo(page, replaceState = false) {
    state.currentPage = page;

    // Update navigation highlight
    navLinks.forEach(link => {
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update URL
    if (replaceState) {
        history.replaceState(null, null, `#${page}`);
    } else {
        history.pushState(null, null, `#${page}`);
    }

    renderPage(page);
}

// Render the current page
function renderPage(page) {
    state.currentPage = page;

    switch (page) {
        case 'home':
            renderHomePage();
            break;
        case 'product':
            renderProductPage();
            break;
        case 'categories':
            renderCategoriesPage();
            break;
        case 'category':
            renderCategoryPage();
            break;
        case 'cart':
            renderCartPage();
            break;
        case 'about':
            renderAboutPage();
            break;
        case 'contact':
            renderContactPage();
            break;
        default:
            renderHomePage();
    }
}

// API Calls
async function fetchProducts() {
    try {
        state.loading = true;
        renderPage(state.currentPage);

        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        state.products = await response.json();
        state.loading = false;
        state.error = null;

        // Re-render the current page with new data
        renderPage(state.currentPage);
    } catch (error) {
        state.loading = false;
        state.error = 'Failed to load products. Please try again later.';
        renderPage(state.currentPage);
    }
}

async function fetchCategories() {
    try {
        const response = await fetch('https://fakestoreapi.com/products/categories');
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }

        state.categories = await response.json();

        // Only re-render if we're on the categories page
        if (state.currentPage === 'categories') {
            renderPage(state.currentPage);
        }
    } catch (error) {
        if (state.currentPage === 'categories') {
            state.error = 'Failed to load categories. Please try again later.';
            renderPage(state.currentPage);
        }
    }
}

async function fetchProductsByCategory(category) {
    try {
        state.loading = true;
        state.selectedCategory = category;
        renderPage('category');

        const response = await fetch(`https://fakestoreapi.com/products/category/${encodeURIComponent(category)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch products for this category');
        }

        state.categoryProducts = await response.json();
        state.loading = false;
        state.error = null;

        renderPage('category');
    } catch (error) {
        state.loading = false;
        state.error = 'Failed to load products for this category. Please try again later.';
        renderPage('category');
    }
}

// Page Rendering Functions
function renderHomePage() {
    let html = `
        <section id="home">
            <div class="hero">
                <h1>Welcome to Sium's Store</h1>
                <p>Discover our amazing products at the best prices!</p>
                <button class="btn">Shop Now</button>
            </div>
    `;

    if (state.loading) {
        html += renderLoading();
    } else if (state.error) {
        html += renderError();
    } else {
        html += `<div class="products-grid">`;

        // Display only the first 8 products
        const displayProducts = state.products.slice(0, 8);

        displayProducts.forEach(product => {
            html += renderProductCard(product);
        });

        html += `</div>`;
    }

    html += `</section>`;
    app.innerHTML = html;

    // Add event listeners to product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const productId = card.getAttribute('data-id');
            state.selectedProductId = productId;
            navigateTo('product');
        });
    });

    // Add event listeners to "Add to Cart" buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = button.getAttribute('data-id');
            const product = state.products.find(p => p.id == productId);
            addToCart(product);
        });
    });

    // Shop Now button scrolls to products
    document.querySelector('.hero .btn').addEventListener('click', () => {
        document.querySelector('.products-grid').scrollIntoView({ behavior: 'smooth' });
    });
}

function renderProductPage() {
    const product = state.products.find(p => p.id == state.selectedProductId);

    if (!product) {
        app.innerHTML = renderError('Product not found');
        return;
    }

    let html = `
        <section id="product">
            <div class="product-details">
                <div class="product-details-image">
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="product-details-info">
                    <h1 class="product-details-title">${product.title}</h1>
                    <p class="product-details-category">${product.category}</p>
                    <p class="product-details-price">$${product.price.toFixed(2)}</p>
                    <p class="product-details-description">${product.description}</p>
                    <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        </section>
    `;

    app.innerHTML = html;

    // Add event listener to "Add to Cart" button
    document.querySelector('.add-to-cart').addEventListener('click', () => {
        addToCart(product);
    });
}

function renderCategoriesPage() {
    let html = `
        <section id="categories">
            <h1>Product Categories</h1>
    `;

    if (state.loading) {
        html += renderLoading();
    } else if (state.error) {
        html += renderError();
    } else {
        html += `<ul class="categories-list">`;

        state.categories.forEach(category => {
            html += `
                <li>
                    <a href="#" class="category-link" data-category="${category}">
                        ${category.charAt(0).toUpperCase() + category.slice(1)}
                    </a>
                </li>
            `;
        });

        html += `</ul>`;
    }

    html += `</section>`;
    app.innerHTML = html;

    // Add event listeners to category links
    document.querySelectorAll('.category-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            fetchProductsByCategory(category);
        });
    });
}

function renderCategoryPage() {
    let html = `
        <section id="category">
            <h1>${state.selectedCategory ? state.selectedCategory.charAt(0).toUpperCase() + state.selectedCategory.slice(1) : 'Category'}</h1>
    `;

    if (state.loading) {
        html += renderLoading();
    } else if (state.error) {
        html += renderError();
    } else if (state.categoryProducts && state.categoryProducts.length > 0) {
        html += `<div class="products-grid">`;

        state.categoryProducts.forEach(product => {
            html += renderProductCard(product);
        });

        html += `</div>`;
    } else {
        html += `<p>No products found in this category.</p>`;
    }

    html += `</section>`;
    app.innerHTML = html;

    // Add event listeners to product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const productId = card.getAttribute('data-id');
            state.selectedProductId = productId;
            navigateTo('product');
        });
    });

    // Add event listeners to "Add to Cart" buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = button.getAttribute('data-id');
            const product = state.categoryProducts.find(p => p.id == productId);
            addToCart(product);
        });
    });
}

function renderCartPage() {
    let html = `
        <section id="cart">
            <div class="cart-container">
                <h1>Your Shopping Cart</h1>
    `;

    if (state.cart.length === 0) {
        html += `
            <div class="empty-cart">
                <p>Your cart is empty.</p>
                <button class="btn" id="continue-shopping">Continue Shopping</button>
            </div>
        `;
    } else {
        html += `<div class="cart-items">`;

        let total = 0;

        state.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            html += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">${item.title}</h3>
                        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                        <div class="cart-item-qty">
                            <button class="decrease-qty" data-id="${item.id}">-</button>
                            <span>${item.quantity}</span>
                            <button class="increase-qty" data-id="${item.id}">+</button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        html += `<div class="cart-total">Total: $${total.toFixed(2)}</div>`;
        html += `
            <div class="cart-actions">
                <button class="btn" id="clear-cart">Clear Cart</button>
                <button class="btn" id="checkout">Checkout</button>
            </div>
        `;
    }

    html += `</div></section>`;
    app.innerHTML = html;

    // Add event listeners
    if (state.cart.length === 0) {
        document.getElementById('continue-shopping').addEventListener('click', () => {
            navigateTo('home');
        });
    } else {
        document.querySelectorAll('.decrease-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                updateCartItemQuantity(btn.getAttribute('data-id'), -1);
            });
        });

        document.querySelectorAll('.increase-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                updateCartItemQuantity(btn.getAttribute('data-id'), 1);
            });
        });

        document.getElementById('clear-cart').addEventListener('click', () => {
            clearCart();
        });

        document.getElementById('checkout').addEventListener('click', () => {
            alert('Checkout functionality would go here!');
        });
    }
}

function renderAboutPage() {
    const html = `
        <section id="about">
            <div class="page-content">
                <h1>About Sium's Store</h1>
                <p>Sium's Store is a minimal e-commerce platform offering a variety of high-quality products. We aim to provide the best shopping experience with a clean, user-friendly interface.</p>
                <p>Our mission is to connect customers with the products they love at affordable prices. We carefully select our inventory to ensure quality and value for our customers.</p>
                <p>Founded in 2023, Sium's Store has quickly grown to become a trusted online retailer. We're constantly improving our platform and expanding our product range to better serve our customers.</p>
            </div>
        </section>
    `;

    app.innerHTML = html;
}

function renderContactPage() {
    const html = `
        <section id="contact">
            <div class="page-content">
                <h1>Contact Us</h1>
                <p>We're here to help! If you have any questions, concerns, or feedback, please don't hesitate to reach out to us.</p>
                <p>Email: support@SiumStore.com</p>
                <p>Phone: +8801814-011382</p>
                <p>Hours: Monday-Friday, 9AM-5PM BDST</p>
                <p>Address: Signboard, Dobadiba, Uttar-khan, Dhaka-1230</p>
            </div>
        </section>
    `;

    app.innerHTML = html;
}

// Helper Functions
function renderProductCard(product) {
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-category">${product.category}</p>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `;
}

function renderLoading() {
    return `
        <div class="loading">
            <div></div>
        </div>
    `;
}

function renderError(message = state.error) {
    return `
        <div class="error">
            <p>${message}</p>
        </div>
    `;
}

// Cart Functions
function addToCart(product) {
    const existingItem = state.cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    // Show confirmation
    alert('Item added to cart!');
}

function updateCartItemQuantity(productId, change) {
    const existingItem = state.cart.find(item => item.id == productId);

    if (existingItem) {
        existingItem.quantity += change;

        if (existingItem.quantity <= 0) {
            // Remove item if quantity is 0 or less
            state.cart = state.cart.filter(item => item.id != productId);
        }

        // Re-render cart page
        renderCartPage();
    }
}

function clearCart() {
    state.cart = [];
    renderCartPage();
}

// Initialize the app
init();




