import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Mail, Phone, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sanitizeInput, validateEmail, checkRateLimit } from '../lib/security';

export default function Contact() {
  const { lang, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // 1. Rate Limiter (OWASP)
    const rateCheck = checkRateLimit('contact_submit', 3, 60000); // 3 requests per minute limit
    if (!rateCheck.allowed) {
      setError('Límite de solicitudes excedido. Por favor espere un minuto.');
      return;
    }

    // 2. Form validation
    const errors: { [key: string]: string } = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName) {
      errors.name = 'Nombre requerido';
    } else if (cleanName.length < 2 || cleanName.length > 100) {
      errors.name = 'El nombre debe tener entre 2 y 100 caracteres';
    }

    if (!cleanEmail) {
      errors.email = 'Correo electrónico requerido';
    } else if (!validateEmail(cleanEmail)) {
      errors.email = 'Correo electrónico no válido';
    }

    if (!cleanSubject) {
      errors.subject = 'Asunto requerido';
    } else if (cleanSubject.length < 3 || cleanSubject.length > 200) {
      errors.subject = 'El asunto debe tener entre 3 y 200 caracteres';
    }

    if (!cleanMessage) {
      errors.message = 'Mensaje requerido';
    } else if (cleanMessage.length < 10 || cleanMessage.length > 2000) {
      errors.message = 'El mensaje debe tener al menos 10 caracteres';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // 3. Sanitization (OWASP - XSS Prevention)
    const sanitizedName = sanitizeInput(cleanName);
    const sanitizedEmail = sanitizeInput(cleanEmail);
    const sanitizedSubject = sanitizeInput(cleanSubject);
    const sanitizedMessage = sanitizeInput(cleanMessage);

    // Form is safe and validated
    console.log('Sending sanitized form data:', {
      name: sanitizedName,
      email: sanitizedEmail,
      subject: sanitizedSubject,
      message: sanitizedMessage
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Header Section */}
        <section className="relative bg-neutral-900 text-white py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 blur-3xl rounded-full"></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
              {t('contactTitle')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
              '¿Tiene alguna pregunta, comentario o sugerencia? Nos encantaría saber de usted. Nuestro equipo está siempre listo para ayudarle.'
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
            
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                  'Información de Contacto'
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-dark/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-1">
                        'Teléfono'
                      </h4>
                      <p className="text-neutral-600" dir="ltr">+573508643913</p>
                      <p className="text-sm text-neutral-500 mt-1">
                        'De Domingo a Jueves, 9 AM - 6 PM'
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-dark/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-1">
                        'Correo Electrónico'
                      </h4>
                      <p className="text-neutral-600">elhocineboul@gmail.com</p>
                      <p className="text-sm text-neutral-500 mt-1">
                        'Responderemos dentro de las 24 horas'
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-dark/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-1">
                        'Horario de Trabajo'
                      </h4>
                      <p className="text-neutral-600">
                        'Domingo - Jueves: 09:00 - 18:00'
                      </p>
                      <p className="text-neutral-600">
                        'Sábado: 10:00 - 14:00'
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-neutral-100">
                <h3 className="text-2xl font-bold text-neutral-900 mb-8">
                  'Envíanos un Mensaje'
                </h3>
                {submitted ? (
                  <div className="p-6 bg-green-50 text-green-800 rounded-2xl border border-green-100 font-bold text-center animate-fade-in">
                    {t('msgSuccess')}
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                      <div className="p-4 bg-red-50 text-red-600 border border-red-200 text-sm rounded-xl font-semibold text-right">
                        {error}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 text-right">
                        <label className="block text-sm font-semibold text-neutral-700">
                          {t('contactName')} *
                        </label>
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                          }}
                          placeholder='Juan Pérez'
                          className={`w-full p-4 bg-neutral-50 border ${fieldErrors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-200'} rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-right`} 
                        />
                        {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                      </div>
                      <div className="space-y-2 text-right">
                        <label className="block text-sm font-semibold text-neutral-700">
                          {t('contactEmail')} *
                        </label>
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                          }}
                          placeholder="juan@example.com"
                          className={`w-full p-4 bg-neutral-50 border ${fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-200'} rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-left`} 
                        />
                        {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-right">
                      <label className="block text-sm font-semibold text-neutral-700">
                        'Asunto' *
                      </label>
                      <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => {
                          setSubject(e.target.value);
                          if (fieldErrors.subject) setFieldErrors(prev => ({ ...prev, subject: '' }));
                        }}
                        placeholder='¿Cómo podemos ayudarle?'
                        className={`w-full p-4 bg-neutral-50 border ${fieldErrors.subject ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-200'} rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-right`} 
                      />
                      {fieldErrors.subject && <p className="text-red-500 text-xs mt-1">{fieldErrors.subject}</p>}
                    </div>
                    
                    <div className="space-y-2 text-right">
                      <label className="block text-sm font-semibold text-neutral-700">
                        {t('contactMsg')} *
                      </label>
                      <textarea 
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (fieldErrors.message) setFieldErrors(prev => ({ ...prev, message: '' }));
                        }}
                        placeholder='Escriba su mensaje aquí...'
                        className={`w-full p-4 bg-neutral-50 border ${fieldErrors.message ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-200'} rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none h-40 resize-none text-right`}
                      ></textarea>
                      {fieldErrors.message && <p className="text-red-500 text-xs mt-1">{fieldErrors.message}</p>}
                    </div>
                    
                    <button type="submit" className="w-full md:w-auto px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                      {t('sendMsg')}
                    </button>
                  </form>
                )}
              </div>
            </div>
            
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
