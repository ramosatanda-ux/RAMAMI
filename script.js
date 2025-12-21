
// CONFIGURATION
// ========================================

// Point de départ de votre magasin (à modifier avec vos coordonnées)
const STORE_LOCATION = {
  lat: 5.338932010855818,
  lng: -4.113577715422971
};

// Tarifs de livraison par distance (en km)
const DELIVERY_RATES = {
  0: 500,      // 0-3 km : 500 FCFA
  3: 1000,     // 3-7 km : 1000 FCFA
  7: 1500,     // 7-12 km : 1500 FCFA
  12: 2000,    // 12-20 km : 2000 FCFA
  20: 3000     // 20+ km : 3000 FCFA
};

// Tarifs par commune (si géolocalisation échoue)
const COMMUNE_RATES = {
  "Cocody": 1500,
  "Plateau": 1500,
  "Marcory": 1500,
  "Koumassi": 1500,
  "Treichville": 1500,
  "Adjamé": 1500,
  "Attécoubé": 2000,
  "Yopougon": 1000,
  "Abobo": 2500,
  "Port-Bouët": 1500,
  "Bingerville": 2500,
  "Songon": 3000,
  "Anyama": 2500
};

// ========================================
// VARIABLES GLOBALES
// ========================================
let cart = [];
let userLocation = null;
let deliveryFee = 0;
let distanceKm = 0;

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

// Calculer distance entre deux points (formule Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculer frais de livraison selon distance
function calculateDeliveryFee(distanceInKm) {
  if (distanceInKm <= 3) return DELIVERY_RATES[0];
  if (distanceInKm <= 7) return DELIVERY_RATES[3];
  if (distanceInKm <= 12) return DELIVERY_RATES[7];
  if (distanceInKm <= 20) return DELIVERY_RATES[12];
  return DELIVERY_RATES[20];
}

// Mettre à jour le panier
function updateCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const cartCount = document.querySelector(".cart-count");
  
  if (!cartItems || !cartTotal || !cartCount) {
    console.warn("Éléments du panier introuvables");
    return;
  }

  cartItems.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach(function (item) {
    total += item.price * item.qty;
    count += item.qty;

    const li = document.createElement("li");
    li.style.marginBottom = "10px";
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    
    const textSpan = document.createElement("span");
    textSpan.textContent = item.name + " × " + item.qty + " - " + (item.price * item.qty).toFixed(0) + " fcfa";
    
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn small remove-item";
    removeBtn.textContent = "×";
    removeBtn.style.marginLeft = "8px";
    removeBtn.style.padding = "4px 8px";
    removeBtn.addEventListener("click", function () {
      cart = cart.filter(function (i) { return i.name !== item.name; });
      updateCart();
    });

    li.appendChild(textSpan);
    li.appendChild(removeBtn);
    cartItems.appendChild(li);
  });

  cartTotal.textContent = total.toFixed(0) + " fcfa";
  cartCount.textContent = count;
}

// Mettre à jour le récapitulatif de commande
function updateOrderSummary() {
  const subtotal = cart.reduce(function(acc, p) { return acc + p.price * p.qty; }, 0);
  const total = subtotal + deliveryFee;
  
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryDelivery = document.getElementById('summaryDelivery');
  const summaryTotal = document.getElementById('summaryTotal');
  const deliverySection = document.getElementById('deliveryLineSection');
  const distanceEl = document.getElementById('deliveryDistance');
  
  if (summarySubtotal) summarySubtotal.textContent = subtotal.toFixed(0) + " fcfa";
  if (summaryDelivery) summaryDelivery.textContent = deliveryFee.toFixed(0) + " fcfa";
  if (summaryTotal) summaryTotal.textContent = total.toFixed(0) + " fcfa";
  
  // Afficher/masquer la ligne livraison
  if (deliverySection) {
    if (deliveryFee > 0) {
      deliverySection.style.display = 'flex';
      if (distanceEl && distanceKm > 0) {
        distanceEl.textContent = '(≈ ' + distanceKm.toFixed(1) + ' km)';
      } else if (distanceEl) {
        distanceEl.textContent = '';
      }
    } else {
      deliverySection.style.display = 'none';
    }
  }
}

// ========================================
// AJOUTER SÉLECTEURS DE QUANTITÉ
// ========================================
function addQuantitySelectors() {
  console.log("🔧 Ajout des sélecteurs de quantité...");
  
  const productCards = document.querySelectorAll('.product-card');
  console.log("📦 Produits trouvés:", productCards.length);
  
  let addedCount = 0;
  
  productCards.forEach(function(card, index) {
    const productBody = card.querySelector('.product-body');
    const addBtn = card.querySelector('.add-btn');
    
    if (!productBody || !addBtn) {
      console.warn("⚠️ Produit", index, "incomplet");
      return;
    }
    
    // Vérifier si existe déjà
    if (card.querySelector('.quantity-control')) {
      return;
    }
    
    // Créer le sélecteur
    const qtyControl = document.createElement('div');
    qtyControl.className = 'quantity-control';
    
    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'qty-btn-small';
    minusBtn.textContent = '−';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'qty-input-small';
    input.value = '1';
    input.min = '1';
    input.max = '99';
    input.readOnly = true;
    
    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'qty-btn-small';
    plusBtn.textContent = '+';
    
    qtyControl.appendChild(minusBtn);
    qtyControl.appendChild(input);
    qtyControl.appendChild(plusBtn);
    
    // Insérer AVANT le bouton Ajouter
    productBody.insertBefore(qtyControl, addBtn);
    
    // Événements
    minusBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      let val = parseInt(input.value) || 1;
      if (val > 1) input.value = val - 1;
    });
    
    plusBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      let val = parseInt(input.value) || 1;
      if (val < 99) input.value = val + 1;
    });
    
    addedCount++;
  });
  
  console.log("✅", addedCount, "sélecteurs ajoutés!");
}

// ========================================
// GÉOLOCALISATION
// ========================================
function initGeolocation() {
  const geoBtn = document.getElementById('geolocateBtn');
  const addressInput = document.getElementById('clientAddress');
  const statusDiv = document.getElementById('addressStatus');
  const communeSelect = document.getElementById('clientCommune');
  
  if (!geoBtn) {
    console.warn("Bouton géolocalisation non trouvé");
    return;
  }
  
  geoBtn.addEventListener('click', function() {
    if (!navigator.geolocation) {
      statusDiv.className = 'address-status error';
      statusDiv.textContent = '✖ Géolocalisation non supportée par votre navigateur';
      return;
    }
    
    geoBtn.disabled = true;
    geoBtn.textContent = '⏳ Localisation...';
    statusDiv.className = 'address-status info';
    statusDiv.textContent = '📡 Recherche de votre position...';
    
    navigator.geolocation.getCurrentPosition(
      function(position) {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        distanceKm = calculateDistance(
          STORE_LOCATION.lat,
          STORE_LOCATION.lng,
          userLocation.lat,
          userLocation.lng
        );
        
        deliveryFee = calculateDeliveryFee(distanceKm);
        
        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + userLocation.lat + '&lon=' + userLocation.lng)
          .then(function(response) { return response.json(); })
          .then(function(data) {
            addressInput.value = data.display_name || 'Adresse trouvée';
            statusDiv.className = 'address-status success';
            statusDiv.textContent = '✓ Position trouvée ! Distance: ' + distanceKm.toFixed(1) + ' km - Livraison: ' + deliveryFee + ' fcfa';
            updateOrderSummary();
          })
          .catch(function() {
            addressInput.value = 'Lat: ' + userLocation.lat.toFixed(6) + ', Lng: ' + userLocation.lng.toFixed(6);
            statusDiv.className = 'address-status success';
            statusDiv.textContent = '✓ Position trouvée ! Distance: ' + distanceKm.toFixed(1) + ' km - Livraison: ' + deliveryFee + ' fcfa';
            updateOrderSummary();
          });
        
        geoBtn.textContent = '✓ Position trouvée';
        setTimeout(function() {
          geoBtn.textContent = '📍 Ma position';
          geoBtn.disabled = false;
        }, 3000);
      },
      function(error) {
        let errorMsg = '✖ Erreur de géolocalisation.';
        if (error.code === 1) errorMsg = '✖ Permission refusée. Activez la géolocalisation.';
        
        statusDiv.className = 'address-status error';
        statusDiv.textContent = errorMsg + ' Sélectionnez votre commune ci-dessous.';
        geoBtn.textContent = '📍 Ma position';
        geoBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
  
  if (communeSelect) {
    communeSelect.addEventListener('change', function() {
      const selectedCommune = this.value;
      if (selectedCommune && COMMUNE_RATES[selectedCommune]) {
        deliveryFee = COMMUNE_RATES[selectedCommune];
        distanceKm = 0;
        statusDiv.className = 'address-status success';
        statusDiv.textContent = '✓ Livraison vers ' + selectedCommune + ': ' + deliveryFee + ' fcfa';
        updateOrderSummary();
      }
    });
  }
}

// ========================================
// RECHERCHE
// ========================================
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  const searchInfo = document.getElementById('searchInfo');
  const productCards = document.querySelectorAll('.product-card');
  const productsGrid = document.querySelector('.products-grid');

  if (!searchInput || !productCards.length) {
    console.log("⚠️ Recherche non initialisée");
    return;
  }

  let noResultsMsg = null;

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

    productCards.forEach(function(card) {
      const title = (card.querySelector('.product-title') && card.querySelector('.product-title').textContent.toLowerCase()) || '';
      const name = (card.dataset.name && card.dataset.name.toLowerCase()) || '';
      const searchText = title + ' ' + name;

      if (searchText.includes(query)) {
        card.classList.remove('hidden');
        visibleCount++;
        if (query) {
          card.classList.add('search-highlight');
          setTimeout(function() { card.classList.remove('search-highlight'); }, 500);
        }
      } else {
        card.classList.add('hidden');
      }
    });

    if (noResultsMsg) {
      noResultsMsg.remove();
      noResultsMsg = null;
    }

    if (query && visibleCount === 0 && productsGrid) {
      noResultsMsg = document.createElement('div');
      noResultsMsg.className = 'no-results';
      noResultsMsg.innerHTML = '<h3>Aucun produit trouvé</h3><p>Essayez avec d\'autres mots-clés</p>';
      productsGrid.appendChild(noResultsMsg);
    }

    if (searchInfo) {
      searchInfo.textContent = query ? (visibleCount + ' produit' + (visibleCount > 1 ? 's' : '') + ' trouvé' + (visibleCount > 1 ? 's' : '')) : '';
    }
  }

  searchInput.addEventListener('input', performSearch);
  
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      searchInput.value = '';
      searchInput.focus();
      performSearch();
    });
  }

  console.log('🔍 Recherche initialisée');
}

// ========================================
// MODAL PRODUIT
// ========================================
function initProductModal() {
  const modal = document.getElementById('productModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalPrice = document.getElementById('modalPrice');
  const modalDescription = document.getElementById('modalDescription');
  const modalFeatures = document.getElementById('modalFeatures');
  const modalAddBtn = document.getElementById('modalAddBtn');

  if (!modal) return;

  let currentProduct = null;

  const productDetails = {
    "Whole Grain Spelt": {
      description: "Lunettes de soleil élégantes avec protection UV complète.",
      features: ["Protection UV400", "Monture légère", "Design moderne", "Étui inclus"]
    },
    "Mt Ida Multigrain": {
      description: "Lunettes de vue avec verres antireflets.",
      features: ["Verres antireflets", "Monture durable", "Confort optimal", "Garantie 1 an"]
    },
    "Bagel Sesame": {
      description: "Casque audio sans fil haute qualité.",
      features: ["Bluetooth 5.0", "Autonomie 20h", "Son immersif", "Microphone intégré"]
    },
    "casque star": {
      description: "Casque premium avec réduction de bruit active.",
      features: ["Réduction de bruit", "Audio HD", "Ultra confortable", "Pliable"]
    }
  };

  const defaultDetails = {
    description: "Un produit de qualité exceptionnelle pour compléter votre style.",
    features: ["Design élégant", "Qualité supérieure", "Livraison rapide", "Service client réactif"]
  };

  document.addEventListener('click', function(e) {
    if (e.target.closest('.add-btn') || e.target.closest('.quantity-control')) {
      return;
    }
    
    const productCard = e.target.closest('.product-card');
    
    if (productCard) {
      const name = productCard.dataset.name || (productCard.querySelector('.product-title') && productCard.querySelector('.product-title').textContent.trim()) || "Produit";
      const priceAttr = productCard.dataset.price;
      const priceText = (productCard.querySelector('.price') && productCard.querySelector('.price').textContent) || "";
      const imageSrc = (productCard.querySelector('.product-media img') && productCard.querySelector('.product-media img').src) || "";
      
      const price = priceAttr || priceText;
      const details = productDetails[name] || defaultDetails;
      
      modalImage.src = imageSrc;
      modalImage.alt = name;
      modalTitle.textContent = name;
      modalPrice.textContent = price + (price.includes('fcfa') ? '' : ' fcfa');
      modalDescription.textContent = details.description;
      
      modalFeatures.innerHTML = '';
      details.features.forEach(function(feature) {
        const li = document.createElement('li');
        li.textContent = feature;
        modalFeatures.appendChild(li);
      });
      
      currentProduct = {
        name: name,
        price: parseFloat(priceAttr) || 0,
        image: imageSrc
      };
      
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  });

  function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  if (modalAddBtn) {
    modalAddBtn.addEventListener('click', function() {
      if (!currentProduct) return;

      const existing = cart.find(function(p) { return p.name === currentProduct.name; });
      if (existing) {
        existing.qty++;
      } else {
        cart.push({ name: currentProduct.name, price: currentProduct.price, qty: 1 });
      }
      
      updateCart();
      modalAddBtn.textContent = '✓ Ajouté au panier !';
      modalAddBtn.style.background = '#4CAF50';
      
      setTimeout(function() {
        modalAddBtn.textContent = '🛒 Ajouter au panier';
        modalAddBtn.style.background = '';
        closeModal();
      }, 1200);
    });
  }
}

// ========================================
// INITIALISATION
// ========================================
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 RamadanExpress - Chargement...");
  
  // 1. AJOUTER LES SÉLECTEURS EN PREMIER
  addQuantitySelectors();
  
  // Année dynamique
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Références DOM
  const cartBtn = document.getElementById("cartBtn");
  const cartOverlay = document.getElementById("cartOverlay");
  const closeCart = document.getElementById("closeCart");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const checkoutOverlay = document.getElementById("checkoutOverlay");
  const closeCheckout = document.getElementById("closeCheckout");
  const orderForm = document.getElementById("orderForm");

  // 2. GÉRER LES BOUTONS AJOUTER
  const addButtons = document.querySelectorAll(".add-btn");
  console.log("📦 Boutons 'Ajouter':", addButtons.length);

  addButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      
      const card = btn.closest(".product-card");
      if (!card) return;

      const name = card.dataset.name || (card.querySelector(".product-title") && card.querySelector(".product-title").textContent.trim()) || "Produit";
      let price = 0;
      
      if (card.dataset.price) {
        price = parseFloat(card.dataset.price.replace(/\s/g, "").replace(",", "."));
      } else {
        const priceText = (card.querySelector(".price") && card.querySelector(".price").textContent) || "";
        const m = priceText.replace(/\s/g, "").replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)/);
        price = m ? parseFloat(m[1]) : 0;
      }
      
      if (!isFinite(price)) price = 0;

      // Récupérer la quantité
      const qtyInput = card.querySelector('.qty-input-small');
      const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

      const existing = cart.find(function (p) { return p.name === name; });
      if (existing) {
        existing.qty += quantity;
      } else {
        cart.push({ name: name, price: price, qty: quantity });
      }

      updateCart();

      const originalText = btn.textContent;
      btn.textContent = "✓ Ajouté x" + quantity;
      btn.disabled = true;
      btn.style.background = "#4CAF50";
      
      // Réinitialiser à 1
      if (qtyInput) qtyInput.value = 1;
      
      setTimeout(function () {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.style.background = "";
      }, 1500);
    });
  });

  // Ouvrir/fermer panier
  if (cartBtn) {
    cartBtn.addEventListener("click", function () {
      if (cartOverlay) cartOverlay.classList.add("show");
    });
  }
  
  if (closeCart) {
    closeCart.addEventListener("click", function () {
      if (cartOverlay) cartOverlay.classList.remove("show");
    });
  }

  // Checkout
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (cart.length === 0) {
        alert("Votre panier est vide.");
        return;
      }
      
      deliveryFee = 0;
      distanceKm = 0;
      updateOrderSummary();
      
      if (cartOverlay) cartOverlay.classList.remove("show");
      if (checkoutOverlay) checkoutOverlay.classList.add("show");
    });
  }
  
  if (closeCheckout) {
    closeCheckout.addEventListener("click", function () {
      if (checkoutOverlay) checkoutOverlay.classList.remove("show");
    });
  }

  // Soumission commande
  if (orderForm) {
    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      
      if (cart.length === 0) {
        alert("Votre panier est vide.");
        if (checkoutOverlay) checkoutOverlay.classList.remove("show");
        return;
      }

      const name = (document.getElementById("clientName") && document.getElementById("clientName").value.trim()) || "Client";
      const phone = (document.getElementById("clientPhone") && document.getElementById("clientPhone").value.trim()) || "";
      const address = (document.getElementById("clientAddress") && document.getElementById("clientAddress").value.trim()) || "";
      const commune = (document.getElementById("clientCommune") && document.getElementById("clientCommune").value) || "";
      
      const subtotal = cart.reduce(function (acc, p) { return acc + p.price * p.qty; }, 0);
      const total = subtotal + deliveryFee;

      let message = "🛍️ NOUVELLE COMMANDE%0A%0A";
      message += "👤 Client : " + encodeURIComponent(name) + "%0A";
      message += "📞 Téléphone : " + encodeURIComponent(phone) + "%0A";
      message += "📍 Adresse : " + encodeURIComponent(address) + "%0A";
      if (commune) message += "🏙️ Commune : " + encodeURIComponent(commune) + "%0A";
      if (distanceKm > 0) message += "📏 Distance : " + distanceKm.toFixed(1) + " km%0A";
      message += "%0A🛒 ARTICLES :%0A";

      cart.forEach(function(item) {
        message += "• " + encodeURIComponent(item.name) + " x" + item.qty + " = " + (item.price * item.qty).toFixed(0) + " fcfa%0A";
      });

      message += "%0A💰 Sous-total : " + subtotal.toFixed(0) + " fcfa%0A";
      message += "🚚 Livraison : " + deliveryFee.toFixed(0) + " fcfa%0A";
      message += "━━━━━━━━━━━━━━━%0A";
      message += "💵 TOTAL : " + total.toFixed(0) + " FCFA";

      window.open("https://wa.me/2250150345214?text=" + message);

      cart = [];
      deliveryFee = 0;
      distanceKm = 0;
      userLocation = null;
      updateCart();
      orderForm.reset();
      if (checkoutOverlay) checkoutOverlay.classList.remove("show");
      
      alert("✓ Commande envoyée ! Total : " + total.toFixed(0) + " fcfa");
    });
  }

  // Initialiser fonctionnalités
  initGeolocation();
  initSearch();
  initProductModal();
  
  console.log("✅ Tout est prêt !");
});
document.querySelectorAll('.quantity-control').forEach(el => {
  console.log('Trouvé:', el);
  el.style.background = ' red';
  el.style.padding = '10px';
});



// ========================================
// RECHERCHE ET FILTRAGE PAR CATÉGORIE
// ========================================
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  const searchInfo = document.getElementById('searchInfo');
  const categoryFilter = document.getElementById('categoryFilter');
  const productCards = document.querySelectorAll('.product-card');
  const productsGrid = document.querySelector('.products-grid');

  if (!searchInput || !productCards.length) {
    console.log("⚠️ Recherche non initialisée");
    return;
  }

  let noResultsMsg = null;

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter ? categoryFilter.value : 'tous';
    let visibleCount = 0;

    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

    productCards.forEach(function(card) {
      const title = (card.querySelector('.product-title') && card.querySelector('.product-title').textContent.toLowerCase()) || '';
      const name = (card.dataset.name && card.dataset.name.toLowerCase()) || '';
      const cardCategory = card.dataset.category || 'tous';
      const searchText = title + ' ' + name;

      // Vérifier catégorie ET recherche
      const matchCategory = selectedCategory === 'tous' || cardCategory === selectedCategory;
      const matchSearch = !query || searchText.includes(query);

      if (matchCategory && matchSearch) {
        card.classList.remove('hidden');
        visibleCount++;
        if (query) {
          card.classList.add('search-highlight');
          setTimeout(function() { card.classList.remove('search-highlight'); }, 500);
        }
      } else {
        card.classList.add('hidden');
      }
    });

    if (noResultsMsg) {
      noResultsMsg.remove();
      noResultsMsg = null;
    }

    if (visibleCount === 0 && productsGrid) {
      noResultsMsg = document.createElement('div');
      noResultsMsg.className = 'no-results';
      noResultsMsg.innerHTML = '<h3>Aucun produit trouvé</h3><p>Essayez avec d\'autres mots-clés ou changez de catégorie</p>';
      productsGrid.appendChild(noResultsMsg);
    }

    if (searchInfo) {
      let infoText = visibleCount + ' produit' + (visibleCount > 1 ? 's' : '');
      if (selectedCategory !== 'tous') {
        infoText += ' dans la catégorie sélectionnée';
      }
      if (query) {
        infoText += ' pour "' + query + '"';
      }
      searchInfo.textContent = visibleCount > 0 ? infoText : '';
    }
  }

  searchInput.addEventListener('input', performSearch);
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', performSearch);
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      searchInput.value = '';
      searchInput.focus();
      performSearch();
    });
  }

  console.log('🔍 Recherche et filtrage initialisés');
}









