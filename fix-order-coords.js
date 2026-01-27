const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/portesillo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Error de conexión:'));
db.once('open', async () => {
  console.log('✅ Conectado a MongoDB');

  try {
    const Order = db.collection('orders');
    
    // Actualizar la orden específica agregando coordenadas
    const result = await Order.updateOne(
      { _id: new mongoose.Types.ObjectId('6967f9e4594c08aff0ea603c') },
      {
        $set: {
          pickupCoords: {
            latitude: -12.0464,
            longitude: -77.0428
          },
          deliveryCoords: {
            latitude: -12.0469,  // ~50 metros más al sur
            longitude: -77.0428
          }
        }
      }
    );

    console.log('✅ Orden actualizada:', result.modifiedCount, 'documento(s) modificado(s)');
    
    // Verificar
    const updated = await Order.findOne({ _id: new mongoose.Types.ObjectId('6967f9e4594c08aff0ea603c') });
    console.log('📍 Coordenadas actualizadas:', {
      pickup: updated.pickupCoords,
      delivery: updated.deliveryCoords
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
});
