const db = require('./utils/db');

async function fixPurchaseAmounts() {
  try {
    const vedikaSubtotal = 1116.65;
    const vedikaGst = 55.35; // 1172 - 1116.65
    const vedikaTotal = 1172.00;

    const padmalayaSubtotal = 3339.47;
    const padmalayaGst = 240.53; // 3580 - 3339.47
    const padmalayaTotal = 3580.00;

    await db('purchases').where({ invoice_number: 'P26272600982' }).update({
      subtotal: vedikaSubtotal,
      gst_amount: vedikaGst,
      total_amount: vedikaTotal
    });
    console.log('Updated Vedika invoice P26272600982 amounts');

    await db('purchases').where({ invoice_number: 'PAS 1935' }).update({
      subtotal: padmalayaSubtotal,
      gst_amount: padmalayaGst,
      total_amount: padmalayaTotal
    });
    console.log('Updated Padmalaya invoice PAS 1935 amounts');

    process.exit(0);
  } catch (error) {
    console.error('Error updating purchases:', error);
    process.exit(1);
  }
}

fixPurchaseAmounts();
