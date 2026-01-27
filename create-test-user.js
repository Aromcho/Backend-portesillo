// Script para crear un usuario de prueba
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: { type: String, default: 'user' },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/portesillo');
    console.log('✅ Conectado a MongoDB');

    // Eliminar usuario existente si ya existe
    const existing = await User.findOne({ email: 'test@test.com' });
    if (existing) {
      await User.deleteOne({ email: 'test@test.com' });
      console.log('🗑️  Usuario anterior eliminado');
    }

    // Crear usuario de prueba con password en texto plano temporalmente
    // El hash se hace en el backend cuando haces login/register
    const user = await User.create({
      name: 'Usuario de Prueba',
      email: 'test@test.com',
      phone: '999888777',
      password: '$2b$10$YourRealHashHere', // Este será reemplazado
      emailVerified: true,
    });

    console.log('✅ Usuario de prueba creado exitosamente:');
    console.log('📧 Email: test@test.com');
    console.log('🔑 Password: 123456');
    console.log('👤 ID:', user._id);
    console.log('\n💡 Ahora usa el REGISTRO en la app para crear un usuario válido');
    console.log('   O registra manualmente con estos datos:');
    console.log('   POST http://localhost:3000/auth/register');
    console.log('   Body: { "name": "Test User", "email": "user@test.com", "phone": "999888777", "password": "123456" }');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();
