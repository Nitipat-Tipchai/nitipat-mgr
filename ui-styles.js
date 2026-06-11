// ══════════════════════════════════════════════════
// CSS OVERRIDES & HELPERS
// ══════════════════════════════════════════════════
const styleBlock = `
    <style>
    .widget-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    @media (max-width: 600px) {
      .widget-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Student ID Card CSS */
    .card-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      animation: fadeIn 0.3s ease;
    }
    .card-modal {
      background: white; width: 90%; max-width: 400px; border-radius: 20px;
      overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      position: relative; animation: slideUp 0.3s ease;
    }
    .card-close {
      position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.1);
      border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
    }
    .card-title {
      background: #003366; color: white; padding: 15px; text-align: center;
      font-weight: 700; font-family: Kanit; letter-spacing: 1px;
    }
    .card-body {
      padding: 20px; text-align: center;
    }
    .card-photo {
      width: 150px; height: 200px; object-fit: cover; border-radius: 10px;
      border: 3px solid #eee; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .card-info {
      margin-bottom: 20px; font-family: Kanit;
    }
    .card-name { font-size: 18px; font-weight: 700; color: #333; }
    .card-id { font-size: 16px; font-weight: 600; color: #666; font-family: 'JetBrains Mono'; }
    .card-major { font-size: 13px; color: #888; }
    .barcode-container {
      background: #f9f9f9; padding: 15px; border-radius: 10px;
      display: flex; justify-content: center; border: 1px dashed #ccc;
    }
    #barcode { width: 100%; height: auto; }
    </style>`;
document.head.insertAdjacentHTML('beforeend', styleBlock);
