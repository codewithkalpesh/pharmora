const db = require('./utils/db');

const vedikaItems = [
  { name: 'PARLE GLUCOSE 5', qty: 24, mrp: 5, rate: 4.54, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: 'PARLE GLUCOSE 10', qty: 12, mrp: 10, rate: 9.09, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: 'MONACO 5', qty: 30, mrp: 5, rate: 4.46, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: 'KRACKJACK 5', qty: 24, mrp: 5, rate: 4.46, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: '20-20 COOCKIE 5', qty: 12, mrp: 5, rate: 4.46, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: 'MARIE 10', qty: 12, mrp: 10, rate: 8.92, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: 'COCONUT 10', qty: 12, mrp: 10, rate: 8.92, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: 'FAB BOURBON 10', qty: 12, mrp: 10, rate: 8.92, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: 'BLACK BB CHO 10', qty: 20, mrp: 10, rate: 8.92, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: 'HIDE & SEEK 10', qty: 12, mrp: 10, rate: 8.92, gst: 5, batch: 'N/A', exp: '2028-06-30' },
  { name: 'JAM-IN MF 10', qty: 12, mrp: 10, rate: 8.92, gst: 5, batch: 'N/A', exp: '2028-06-30' }
];

const padmalayaItems = [
  { name: 'GARNIER TURBO BRIGHT FW', qty: 1, mrp: 139.00, rate: 105.21, gst: 18, batch: 'B764643818', exp: '2029-02-28' },
  { name: 'DETTOL SOAP ORG100GM*5', qty: 1, mrp: 182.00, rate: 160.49, gst: 5, batch: 'BSVT-464', exp: '2028-03-31' },
  { name: 'DETTOL SOAP RS10', qty: 5, mrp: 10.00, rate: 8.82, gst: 5, batch: 'P0526', exp: '2028-03-31' },
  { name: 'SANTOOR SOAP', qty: 1, mrp: 150.00, rate: 134.79, gst: 5, batch: '0426', exp: '2028-03-31' },
  { name: 'DOVE SOAP 1', qty: 1, mrp: 25.00, rate: 21.65, gst: 5, batch: '0526', exp: '2028-03-31' },
  { name: 'DOVE SOAP 2', qty: 1, mrp: 25.00, rate: 21.65, gst: 5, batch: '04-26', exp: '2028-03-31' },
  { name: 'DOVE SOAP 3', qty: 1, mrp: 25.00, rate: 21.65, gst: 5, batch: '0526', exp: '2028-03-31' },
  { name: 'INDULEKHA BRINGHA OIL 50M', qty: 1, mrp: 155.00, rate: 134.30, gst: 5, batch: '0526', exp: '2028-03-31' },
  { name: 'KESH KING SHP 200ML', qty: 1, mrp: 234.00, rate: 185.71, gst: 5, batch: 'KT05762', exp: '2028-03-31' },
  { name: 'PARACHUTE OIL BOTT', qty: 4, mrp: 20.00, rate: 17.32, gst: 5, batch: '0626', exp: '2028-03-31' },
  { name: 'PARACHUTE OIL GOLD PLUS', qty: 1, mrp: 65.00, rate: 59.29, gst: 5, batch: 'KT0507', exp: '2028-03-31' },
  { name: 'BORO PLUS CRM RS10/-TUB', qty: 5, mrp: 10.00, rate: 8.66, gst: 5, batch: '0626', exp: '2028-03-31' },
  { name: 'NIVEA CREME TIN 20ML', qty: 2, mrp: 65.00, rate: 48.80, gst: 18, batch: '54233011', exp: '2028-03-31' },
  { name: 'GOD.EXP.CRM.NAT BLACK SAC', qty: 1, mrp: 150.00, rate: 113.50, gst: 18, batch: '0626', exp: '2028-03-31' },
  { name: 'STREAX SHAMPOO NAT.BLACK', qty: 1, mrp: 180.00, rate: 136.21, gst: 18, batch: 'PB0526', exp: '2028-03-31' },
  { name: 'CLINIC PLUS SHAMPOO SACHE', qty: 2, mrp: 16.00, rate: 13.25, gst: 5, batch: '0526', exp: '2028-03-31' },
  { name: 'SENSODYNE FRESH MINT', qty: 1, mrp: 85.00, rate: 70.52, gst: 5, batch: 'BGM260169', exp: '2028-02-29' },
  { name: 'SENSODYNE RAPID GEL 40GM', qty: 1, mrp: 110.00, rate: 91.10, gst: 5, batch: 'BGR260024', exp: '2028-01-31' },
  { name: 'COL STRONG TEETH RS 10', qty: 4, mrp: 10.00, rate: 8.66, gst: 5, batch: '0426', exp: '2028-03-31' },
  { name: 'COL MAXFRESH RED RS20', qty: 4, mrp: 20.00, rate: 17.31, gst: 5, batch: '0626', exp: '2028-03-31' },
  { name: 'IODEX RUB', qty: 2, mrp: 95.00, rate: 78.71, gst: 5, batch: '0526', exp: '2028-03-31' },
  { name: 'IODEX RUB 2', qty: 2, mrp: 50.00, rate: 41.87, gst: 5, batch: 'H26043', exp: '2028-02-29' },
  { name: 'GILLETE GUARD CART', qty: 1, mrp: 150.00, rate: 101.70, gst: 18, batch: '0626', exp: '2028-03-31' },
  { name: 'FEM OXY BLEACH 9GM', qty: 1, mrp: 55.00, rate: 40.53, gst: 18, batch: 'BM1546', exp: '2027-09-30' },
  { name: 'OLIVIA GOLD BLEACH 9GM', qty: 1, mrp: 50.00, rate: 38.20, gst: 18, batch: '0426', exp: '2028-03-31' },
  { name: 'GOOD N8 MAHAJUMBO COIL', qty: 2, mrp: 47.00, rate: 31.86, gst: 18, batch: '0626', exp: '2028-03-31' },
  { name: 'GOOD N8 GOLD FLASH REFIL', qty: 2, mrp: 85.00, rate: 65.49, gst: 18, batch: 'STC 0426', exp: '2028-03-31' },
  { name: 'DETTOL LIQ 125ML', qty: 1, mrp: 83.03, rate: 69.37, gst: 5, batch: 'VV524', exp: '2029-09-30' },
  { name: 'DETTOL ASL REG-60ML', qty: 2, mrp: 41.49, rate: 34.66, gst: 5, batch: 'VV520', exp: '2029-09-30' },
  { name: 'ZANDU BALM', qty: 2, mrp: 43.00, rate: 36.33, gst: 5, batch: 'KT110', exp: '2028-03-31' },
  { name: 'VVR 50GM BIG', qty: 1, mrp: 199.00, rate: 147.85, gst: 5, batch: '6072C56704', exp: '2028-02-29' },
  { name: 'NYCIL POWDER COOL HERBAL', qty: 5, mrp: 10.00, rate: 8.51, gst: 5, batch: '0626', exp: '2028-03-31' },
  { name: 'MANFORCE CON.SUNNY 1', qty: 5, mrp: 30.00, rate: 24.00, gst: 0, batch: 'L3EIY048', exp: '2028-08-31' },
  { name: 'MANFORCE CON.SUNNY 2', qty: 5, mrp: 30.00, rate: 24.00, gst: 0, batch: 'L3EIY049', exp: '2028-08-31' },
  { name: 'SKORE CON.CHERRY FLV.DOT', qty: 5, mrp: 40.00, rate: 33.90, gst: 0, batch: 'VR25043', exp: '2030-10-31' },
  { name: 'SKORE CONDOM CHOCOLAT 3PK', qty: 5, mrp: 40.00, rate: 33.90, gst: 0, batch: 'VU25091', exp: '2030-10-31' },
  { name: 'SKORE CONDOM SHADES 3PK', qty: 3, mrp: 40.00, rate: 33.90, gst: 0, batch: 'V25061', exp: '2030-08-31' }
];

async function seedPurchase(supplierName, invoiceNumber, invoiceDate, items) {
  const trx = await db.transaction();
  try {
    let supplier = await trx('suppliers').where({ supplier_name: supplierName }).first();
    if (!supplier) {
      const [newSupp] = await trx('suppliers').insert({
        supplier_name: supplierName,
        gst_number: 'PENDING',
        drug_license_number: 'PENDING',
        email: 'pending@example.com',
        phone: '0000000000',
        address: 'JALGAON'
      }).returning('*');
      supplier = newSupp;
      console.log('Created supplier:', supplier.id);
    } else {
      console.log('Found supplier:', supplier.id);
    }

    let subtotal = 0;
    let total_amount = 0;
    const itemsForPurchase = [];

    for (const item of items) {
      console.log(`Processing ${item.name}...`);
      let med = await trx('medicines').where('name', item.name).first();
      if (!med) {
        console.log(`Inserting medicine ${item.name}`);
        const [newMed] = await trx('medicines').insert({
          name: item.name,
          category: 'General',
          purchase_price: item.rate,
          selling_price: item.rate * 1.2,
          mrp: item.mrp,
          gst_rate: item.gst || 12.0
        }).returning('*');
        med = newMed;
      }

      itemsForPurchase.push({
        medicine_id: med.id,
        batch_number: item.batch,
        expiry_date: item.exp,
        quantity: item.qty,
        purchase_rate: item.rate,
        mrp: item.mrp,
        selling_price: item.mrp,
        gst_rate: item.gst || 12.0
      });

      const lineTotal = item.qty * item.rate;
      subtotal += lineTotal;
      total_amount += lineTotal * (1 + (item.gst || 12.0) / 100);
    }

    console.log(`Inserting purchase ${invoiceNumber}...`);
    const [purchase] = await trx('purchases').insert({
      supplier_id: supplier.id,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      subtotal: subtotal,
      gst_amount: total_amount - subtotal,
      total_amount: total_amount,
      status: 'Completed',
      created_by: null
    }).returning('*');
    console.log(`Purchase created: ${purchase.id}`);

    for (const item of itemsForPurchase) {
      console.log(`Processing purchase item ${item.medicine_id}...`);
      let batch = await trx('batches').where({ medicine_id: item.medicine_id, batch_number: item.batch_number }).first();
      if (batch) {
        await trx('batches').where({ id: batch.id }).update({
          quantity: batch.quantity + parseInt(item.quantity),
          updated_at: trx.fn.now()
        });
      } else {
        const [newBatch] = await trx('batches').insert({
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          quantity: item.quantity,
          purchase_rate: item.purchase_rate,
          mrp: item.mrp,
          selling_price: item.selling_price
        }).returning('*');
        batch = newBatch;
      }

      console.log(`Checking inventory for ${item.medicine_id}...`);
      const inventory = await trx('inventory').where({ medicine_id: item.medicine_id }).first();
      if (inventory) {
        await trx('inventory').where({ medicine_id: item.medicine_id }).update({
          current_stock: inventory.current_stock + parseInt(item.quantity),
          updated_at: trx.fn.now()
        });
      } else {
        await trx('inventory').insert({
          medicine_id: item.medicine_id,
          current_stock: item.quantity,
          minimum_stock: 10,
          reorder_level: 15
        });
      }

      console.log(`Inserting purchase_item for ${item.medicine_id}...`);
      await trx('purchase_items').insert({
        purchase_id: purchase.id,
        medicine_id: item.medicine_id,
        batch_id: batch.id,
        quantity: item.quantity,
        purchase_rate: item.purchase_rate,
        gst_rate: item.gst_rate,
        total: item.purchase_rate * item.quantity
      });
    }

    console.log('Committing transaction...');
    await trx.commit();
    console.log(`Purchase ${invoiceNumber} imported successfully!`);
  } catch (err) {
    console.log('Rolling back...');
    await trx.rollback();
    console.error(`Transaction failed for ${invoiceNumber}:`, err);
  }
}

async function run() {
  // await seedPurchase('VEDIKA ENTERPRISES', 'P26272600982', '2026-06-23', vedikaItems);
  await seedPurchase('PADMALAYA SALES', 'PAS 1935', '2026-06-23', padmalayaItems);
  process.exit(0);
}

run();
