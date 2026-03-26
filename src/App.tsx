import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  CreditCard, 
  Wallet, 
  Clock, 
  Flame, 
  ArrowRight,
  ShoppingCart,
  Info,
  Leaf,
  Heart,
  Zap,
  Star,
  Download,
  RefreshCw
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { generateTamilMealPlan, UserProfile } from './services/geminiService';

const FOOD_ITEMS = [
  { id: 'egg', label: 'Eggs (முட்டை)', defaultFreq: 'daily' },
  { id: 'chicken', label: 'Chicken (கோழி)', defaultFreq: 'weekly' },
  { id: 'fish', label: 'Fish (மீன்)', defaultFreq: 'weekly' },
  { id: 'mutton', label: 'Mutton (ஆடு)', defaultFreq: 'rarely' },
  { id: 'paneer', label: 'Paneer (பன்னீர்)', defaultFreq: 'weekly' },
  { id: 'milk', label: 'Milk/Curd (பால்/தயிர்)', defaultFreq: 'daily' },
  { id: 'fruits', label: 'Seasonal Fruits (பழங்கள்)', defaultFreq: 'daily' },
  { id: 'nuts', label: 'Nuts (கொட்டைகள்)', defaultFreq: 'weekly' },
];

const DIET_TYPES = [
  { id: 'veg', label: 'Vegetarian (சைவம்)', icon: '🥦' },
  { id: 'non-veg', label: 'Non-Vegetarian (அசைவம்)', icon: '🍗' },
  { id: 'egg-only', label: 'Egg-only (முட்டை மட்டும்)', icon: '🥚' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
];

const GOALS = [
  { id: 'weight-loss', label: 'Weight Loss (எடை குறைப்பு)', icon: '🔥' },
  { id: 'weight-gain', label: 'Weight Gain (எடை அதிகரிப்பு)', icon: '💪' },
  { id: 'maintenance', label: 'Maintenance (பராமரிப்பு)', icon: '⚖️' },
  { id: 'muscle-building', label: 'Muscle Building (தசை வளர்ச்சி)', icon: '🏋️' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary (குறைந்த செயல்பாடு)', desc: 'Office job, little exercise', icon: '🪑' },
  { id: 'lightly-active', label: 'Lightly Active (மிதமான செயல்பாடு)', desc: 'Light exercise 1-3 days/week', icon: '🚶' },
  { id: 'moderately-active', label: 'Moderately Active (சுறுசுறுப்பான)', desc: 'Moderate exercise 3-5 days/week', icon: '🏃' },
  { id: 'very-active', label: 'Very Active (மிகவும் சுறுசுறுப்பான)', desc: 'Hard exercise 6-7 days/week', icon: '🚴' },
];

const HEALTH_FOCUS = [
  { id: 'diabetes', label: 'Diabetes Friendly (சர்க்கரை நோய்)', icon: '🩸' },
  { id: 'pcos', label: 'PCOS/PCOD', icon: '🌸' },
  { id: 'thyroid', label: 'Thyroid Care (தைராய்டு)', icon: '🦋' },
  { id: 'heart-health', label: 'Heart Health (இதய ஆரோக்கியம்)', icon: '❤️' },
  { id: 'digestion', label: 'Better Digestion (செரிமானம்)', icon: '🥣' },
  { id: 'skin-hair', label: 'Skin & Hair (தோல் மற்றும் முடி)', icon: '✨' },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

const DayCard = ({ day, profile, formatText }: { day: any, profile: any, formatText: (t: string) => string, key?: any }) => (
  <div className="banana-leaf-card p-5 md:p-8 space-y-5 md:space-y-8 hover:scale-[1.02] transition-transform cursor-default border-[rgba(27,58,27,0.05)]">
    <div className="flex justify-between items-start">
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-xl md:text-3xl text-leaf-dark truncate">{formatText(day.day)}</h3>
        <div className="flex items-center gap-2 mt-1">
          <div className="px-2 py-0.5 rounded bg-turmeric text-[8px] md:text-[10px] font-black uppercase text-leaf-dark">
            {day.totalCalories} kcal
          </div>
        </div>
      </div>
      <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-leaf-light flex items-center justify-center text-leaf-dark shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.06)] flex-shrink-0">
        <Clock size={16} className="md:w-5 md:h-5" />
      </div>
    </div>

    <div className="space-y-4 md:space-y-6">
      {[
        { label: 'Breakfast', val: day.meals.breakfast, icon: '🌅' },
        { label: 'Mid-Morning', val: day.meals.midMorning, icon: '🍵' },
        { label: 'Lunch', val: day.meals.lunch, icon: '☀️' },
        { label: 'Evening', val: day.meals.eveningSnack, icon: '🍎' },
        { label: 'Dinner', val: day.meals.dinner, icon: '🌙' },
      ].map((m, i) => (
        <div key={i} className="relative pl-6 md:pl-8 border-l-2 border-[rgba(27,58,27,0.05)]">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-leaf-dark flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-leaf-dark" />
          </div>
          <div className="flex items-center gap-2 mb-0.5 md:mb-1">
            <span className="text-base md:text-lg">{m.icon}</span>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(27,58,27,0.5)]">{m.label}</span>
          </div>
          <p className="text-xs md:text-sm font-black text-leaf-dark leading-relaxed">{formatText(m.val)}</p>
        </div>
      ))}
    </div>

    {day.macros && (
      <div className="mt-8 pt-6 border-t border-[rgba(27,58,27,0.05)] space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-[rgba(27,58,27,0.4)]">Protein</p>
            <p className="font-black text-leaf-dark text-xs">{day.macros.protein}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-[rgba(27,58,27,0.4)]">Carbs</p>
            <p className="font-black text-leaf-dark text-xs">{day.macros.carbs}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-[rgba(27,58,27,0.4)]">Fats</p>
            <p className="font-black text-leaf-dark text-xs">{day.macros.fats}</p>
          </div>
        </div>
        
        <div className="h-1.5 w-full bg-leaf-light rounded-full overflow-hidden flex">
          <div className="h-full bg-leaf-dark" style={{ width: '30%' }} />
          <div className="h-full bg-turmeric" style={{ width: '50%' }} />
          <div className="h-full bg-leaf-medium" style={{ width: '20%' }} />
        </div>
      </div>
    )}

    {day.culturalContext && (
      <div className="mt-6 p-4 bg-[rgba(241,248,233,0.5)] rounded-2xl border border-[rgba(27,58,27,0.05)]">
        <p className="text-[10px] font-black text-leaf-medium uppercase tracking-widest mb-1 flex items-center gap-2">
          <Star size={10} fill="currentColor" /> Cultural Tip
        </p>
        <p className="text-xs italic text-[rgba(27,58,27,0.7)] leading-relaxed">{formatText(day.culturalContext)}</p>
      </div>
    )}
  </div>
);

export default function App() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [paid, setPaid] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'7-day' | '30-day'>('7-day');
  const [customItem, setCustomItem] = useState('');
  const [language, setLanguage] = useState<'bilingual' | 'tamil' | 'english'>('bilingual');

  const [profile, setProfile] = useState<UserProfile>({
    age: 25,
    weight: 70,
    height: 170,
    goals: ['maintenance'],
    dietType: ['non-veg'],
    activityLevel: 'sedentary',
    healthFocus: [],
    affordability: FOOD_ITEMS.map(item => ({ item: item.label, frequency: item.defaultFreq as any })),
    region: 'Tamil Nadu',
    duration: '7-day'
  });

  const formatText = (text: string) => {
    if (!text) return "";
    if (language === 'bilingual') return text;
    
    // Pattern: "Tamil (English)"
    const match = text.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return language === 'tamil' ? match[1].trim() : match[2].trim();
    }
    return text;
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleDietType = (id: string) => {
    setProfile(prev => {
      const exists = prev.dietType.includes(id);
      if (exists) {
        if (prev.dietType.length === 1) return prev;
        return { ...prev, dietType: prev.dietType.filter(t => t !== id) };
      }
      return { ...prev, dietType: [...prev.dietType, id] };
    });
  };

  const toggleGoal = (id: string) => {
    setProfile(prev => {
      const exists = prev.goals.includes(id);
      if (exists) {
        if (prev.goals.length === 1) return prev;
        return { ...prev, goals: prev.goals.filter(g => g !== id) };
      }
      return { ...prev, goals: [...prev.goals, id] };
    });
  };

  const toggleHealthFocus = (id: string) => {
    setProfile(prev => {
      const exists = prev.healthFocus.includes(id);
      if (exists) {
        return { ...prev, healthFocus: prev.healthFocus.filter(h => h !== id) };
      }
      return { ...prev, healthFocus: [...prev.healthFocus, id] };
    });
  };

  const selectActivity = (id: any) => {
    setProfile(prev => ({ ...prev, activityLevel: id }));
  };

  const addCustomItem = () => {
    if (!customItem.trim()) return;
    const newItem = { item: customItem, frequency: 'weekly' as any };
    setProfile(prev => ({
      ...prev,
      affordability: [...prev.affordability, newItem]
    }));
    setCustomItem('');
  };

  const updateAffordability = (itemLabel: string, freq: string) => {
    setProfile(prev => ({
      ...prev,
      affordability: prev.affordability.map(a => 
        a.item === itemLabel ? { ...a, frequency: freq as any } : a
      )
    }));
  };

  const generatePlan = async (durationOverride?: '7-day' | '30-day') => {
    setLoading(true);
    try {
      const currentDuration = durationOverride || selectedPlan;
      const result = await generateTamilMealPlan({ ...profile, duration: currentDuration });
      setPlan(result);
      setStep(5);
    } catch (error) {
      console.error("Error generating plan:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (planType: '7-day' | '30-day') => {
    setSelectedPlan(planType);
    setPaymentStep(true);
  };

  const confirmPayment = async () => {
    setLoading(true);
    try {
      const amount = selectedPlan === '7-day' ? 20 : 50;
      
      // 1. Create Order on Server
      const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      
      if (!orderRes.ok) throw new Error('Failed to create order');
      const order = await orderRes.json();

      // 2. Initialize Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy_id',
        amount: order.amount,
        currency: order.currency,
        name: "TamilDiet",
        description: `${selectedPlan} Meal Plan`,
        order_id: order.id,
        handler: async (response: any) => {
          // 3. Verify Payment
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });

          if (verifyRes.ok) {
            setPaid(true);
            setPaymentStep(false);
            setShowSuccess(true);
            if (selectedPlan === '30-day') {
              await generatePlan('30-day');
            }
            setTimeout(() => setShowSuccess(false), 3000);
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
        },
        theme: {
          color: "#1B4D1B", // leaf-dark
        },
      };

      if (typeof window.Razorpay === 'undefined') {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed to initialize. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    console.log("Download PDF triggered via html-to-image (multi-page)");
    const element = document.getElementById('meal-plan-content');
    
    if (!element) {
      console.error("Meal plan content element not found");
      alert("Could not find the meal plan content to download.");
      return;
    }

    setLoading(true);
    try {
      // Temporarily set a fixed width to ensure a consistent layout in the PDF
      // 1200px is a good width for a 4-column layout
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      element.style.width = '1200px';
      element.style.maxWidth = 'none';

      // Wait a bit for layout to settle
      await new Promise(resolve => setTimeout(resolve, 150));

      // Use html-to-image to get a high-quality PNG
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#f1f8e9',
        style: {
          borderRadius: '0',
        },
        filter: (node: any) => {
          if (node.tagName === 'BUTTON') return false;
          return true;
        }
      });

      // Restore original styles
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`TamilDiet_${plan.planName.replace(/\s+/g, '_')}.pdf`);
      console.log("PDF download successful");
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please use your browser's print feature (Ctrl+P) as a fallback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-[rgba(85,139,47,0.3)]">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-[rgba(27,58,27,0.1)] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[rgba(255,255,255,0.9)] backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setStep(0)}>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-leaf-dark rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
            <Leaf size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-leaf-dark">TamilDiet</h1>
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-leaf-medium">தமிழ் உணவியல்</p>
          </div>
        </div>
        <div className="hidden lg:flex gap-8 text-xs font-black uppercase tracking-widest text-[rgba(27,58,27,0.6)]">
          <a href="#" className="hover:text-leaf-dark transition-colors">Our Story</a>
          <a href="#" className="hover:text-leaf-dark transition-colors">Pricing</a>
          <a href="#" className="hover:text-leaf-dark transition-colors">Culture</a>
        </div>
        
        <div className="flex items-center gap-2 bg-leaf-light p-1 rounded-xl">
          {(['bilingual', 'tamil', 'english'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                language === l ? 'bg-leaf-dark text-white shadow-md' : 'text-leaf-dark/40 hover:text-leaf-dark'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button className="tamil-btn !py-2 !px-6 !text-sm !rounded-xl w-full sm:w-auto">
          Sign In
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 py-12">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-12 py-12"
            >
              <div className="space-y-6">
                <div className="inline-block p-4 bg-leaf-dark/5 rounded-[2rem] rotate-3 mb-4">
                  <div className="w-24 h-24 bg-leaf-dark rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
                    <Utensils size={48} />
                  </div>
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-leaf-dark">Vanakkam!</h2>
                <p className="text-lg md:text-xl text-leaf-dark/60 max-w-2xl mx-auto leading-relaxed">
                  Welcome to TamilDiet. We create personalized meal plans that respect your culture, your body, and your budget.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto px-4">
                {[
                  { icon: <Leaf />, title: 'Authentic', desc: 'Traditional Tamil recipes' },
                  { icon: <Heart />, title: 'Healthy', desc: 'Tailored to your goals' },
                  { icon: <Wallet />, title: 'Affordable', desc: 'Based on your budget' },
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-white rounded-3xl border border-leaf-dark/5 shadow-sm">
                    <div className="w-10 h-10 bg-leaf-light rounded-xl flex items-center justify-center text-leaf-dark mx-auto mb-4">
                      {item.icon}
                    </div>
                    <h4 className="font-bold text-leaf-dark">{item.title}</h4>
                    <p className="text-xs text-leaf-dark/40 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleNext}
                className="tamil-btn px-10 md:px-16 py-4 md:py-6 text-xl md:text-2xl shadow-leaf-dark/20 shadow-2xl w-full sm:w-auto"
              >
                Get Started <ArrowRight size={28} />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-turmeric/20 text-leaf-dark text-xs font-bold uppercase tracking-widest">
                  <Star size={12} fill="currentColor" />
                  <span>Step 1 of 5</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-leaf-dark">Body & Goals</h2>
                <p className="text-leaf-dark/60 max-w-lg mx-auto text-sm md:text-base">Tell us about yourself. You can select multiple goals. உங்கள் விவரங்களை உள்ளிடவும்.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                <div className="banana-leaf-card p-6 md:p-10 space-y-8">
                  <h3 className="text-xl md:text-2xl font-bold text-leaf-dark border-b border-leaf-dark/10 pb-4">Body Metrics</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="label-text">Age (வயது)</label>
                      <input 
                        type="number" 
                        value={profile.age}
                        onChange={e => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                        className="input-field text-xl md:text-2xl"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="label-text">Weight (kg)</label>
                        <input 
                          type="number" 
                          value={profile.weight}
                          onChange={e => setProfile({...profile, weight: parseInt(e.target.value) || 0})}
                          className="input-field text-xl md:text-2xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="label-text">Height (cm)</label>
                        <input 
                          type="number" 
                          value={profile.height}
                          onChange={e => setProfile({...profile, height: parseInt(e.target.value) || 0})}
                          className="input-field text-xl md:text-2xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <h3 className="label-text mb-0">Select Goals (இலக்குகள்)</h3>
                    <span className="text-[10px] font-bold text-leaf-medium bg-leaf-medium/10 px-2 py-1 rounded">Multi-select enabled</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {GOALS.map(goal => (
                      <button
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${
                          profile.goals.includes(goal.id) 
                            ? 'border-leaf-dark bg-leaf-dark text-white shadow-xl scale-[1.02]' 
                            : 'border-leaf-dark/10 bg-white hover:border-leaf-medium hover:bg-leaf-light'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{goal.icon}</span>
                          <span className="font-bold text-lg">{goal.label}</span>
                        </div>
                        {profile.goals.includes(goal.id) && <Check size={20} className="text-turmeric" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={handleNext}
                  className="tamil-btn px-10 md:px-16 py-4 md:py-6 text-xl md:text-2xl shadow-leaf-dark/20 shadow-2xl w-full sm:w-auto"
                >
                  Continue <ArrowRight size={28} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-turmeric/20 text-leaf-dark text-xs font-bold uppercase tracking-widest">
                  <Star size={12} fill="currentColor" />
                  <span>Step 2 of 5</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-leaf-dark">Activity & Focus</h2>
                <p className="text-leaf-dark/60 max-w-lg mx-auto text-sm md:text-base">How active are you? Any specific health focus?</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-4">
                  <h3 className="label-text">Activity Level (செயல்பாடு)</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {ACTIVITY_LEVELS.map(level => (
                      <button
                        key={level.id}
                        onClick={() => selectActivity(level.id)}
                        className={`p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                          profile.activityLevel === level.id 
                            ? 'border-leaf-dark bg-leaf-dark text-white shadow-xl scale-[1.02]' 
                            : 'border-leaf-dark/10 bg-white hover:border-leaf-medium hover:bg-leaf-light'
                        }`}
                      >
                        <span className="text-xl md:text-2xl">{level.icon}</span>
                        <div>
                          <p className="font-bold text-base md:text-lg">{level.label}</p>
                          <p className={`text-[10px] md:text-xs ${profile.activityLevel === level.id ? 'text-white/80' : 'text-leaf-dark/50'}`}>{level.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <h3 className="label-text mb-0">Health Focus (ஆரோக்கிய கவனம்)</h3>
                    <span className="text-[10px] font-bold text-leaf-medium bg-leaf-medium/10 px-2 py-1 rounded">Optional Multi-select</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {HEALTH_FOCUS.map(focus => (
                      <button
                        key={focus.id}
                        onClick={() => toggleHealthFocus(focus.id)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                          profile.healthFocus.includes(focus.id) 
                            ? 'border-leaf-dark bg-leaf-dark text-white shadow-xl' 
                            : 'border-leaf-dark/10 bg-white hover:border-leaf-medium hover:bg-leaf-light'
                        }`}
                      >
                        <span className="text-2xl">{focus.icon}</span>
                        <span className="font-bold text-xs">{focus.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between max-w-3xl mx-auto pt-8 gap-4">
                <button onClick={handleBack} className="tamil-btn-outline w-full sm:w-auto"><ChevronLeft size={20} /> Back</button>
                <button onClick={handleNext} className="tamil-btn px-10 md:px-12 py-4 md:py-5 text-lg md:text-xl shadow-leaf-dark/20 shadow-2xl w-full sm:w-auto">Next Step <ArrowRight size={24} /></button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-turmeric/20 text-leaf-dark text-xs font-bold uppercase tracking-widest">
                  <Star size={12} fill="currentColor" />
                  <span>Step 3 of 5</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-leaf-dark">Dietary Choices</h2>
                <p className="text-leaf-dark/60 max-w-lg mx-auto text-sm md:text-base">Select all that apply. உங்கள் உணவு விருப்பங்களை தேர்வு செய்யவும்.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
                {DIET_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => toggleDietType(type.id)}
                    className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 text-center group relative ${
                      profile.dietType.includes(type.id) 
                        ? 'border-leaf-dark bg-leaf-dark text-white shadow-2xl scale-105' 
                        : 'border-leaf-dark/10 bg-white hover:border-leaf-medium hover:bg-leaf-light'
                    }`}
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl mb-2 transition-transform group-hover:scale-110 ${
                      profile.dietType.includes(type.id) ? 'bg-white/20' : 'bg-leaf-light'
                    }`}>
                      {type.icon}
                    </div>
                    <span className="font-bold text-lg md:text-xl">{type.label}</span>
                    {profile.dietType.includes(type.id) && (
                      <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-turmeric text-leaf-dark p-1 rounded-full shadow-lg">
                        <Check size={16} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between max-w-3xl mx-auto pt-8 gap-4">
                <button onClick={handleBack} className="tamil-btn-outline w-full sm:w-auto"><ChevronLeft size={20} /> Back</button>
                <button onClick={handleNext} className="tamil-btn px-10 md:px-12 py-4 md:py-5 text-lg md:text-xl shadow-leaf-dark/20 shadow-2xl w-full sm:w-auto">Next Step <ArrowRight size={24} /></button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-turmeric/20 text-leaf-dark text-xs font-bold uppercase tracking-widest">
                  <Star size={12} fill="currentColor" />
                  <span>Step 4 of 5</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-leaf-dark">Budget & Staples</h2>
                <p className="text-leaf-dark/60 max-w-lg mx-auto text-sm md:text-base">How often can you afford these items? எதை எவ்வளவு அடிக்கடி சாப்பிட முடியும்?</p>
              </div>

              <div className="banana-leaf-card shadow-2xl overflow-hidden">
                <div className="p-6 md:p-10 bg-leaf-dark text-white flex flex-col sm:flex-row items-center justify-between relative overflow-hidden gap-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                  <div className="flex items-center gap-4 relative">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-2xl flex items-center justify-center text-turmeric">
                      <Zap size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold">Budget-Friendly Planning</h3>
                      <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">Tailored to your pocket</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-leaf-dark/5">
                  {profile.affordability.map((item, idx) => (
                    <div key={idx} className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-leaf-light/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-leaf-medium/10 flex items-center justify-center text-leaf-dark">
                          <Utensils size={18} className="md:w-5 md:h-5" />
                        </div>
                        <span className="font-bold text-lg md:text-xl text-leaf-dark">{item.item}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['daily', 'weekly', 'rarely', 'never'].map(freq => (
                          <button
                            key={freq}
                            onClick={() => updateAffordability(item.item, freq)}
                            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                              item.frequency === freq
                                ? 'bg-leaf-dark text-white border-leaf-dark shadow-lg scale-105'
                                : 'bg-white text-leaf-dark/30 border-leaf-dark/5 hover:border-leaf-medium hover:text-leaf-medium'
                            }`}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="p-6 md:p-10 bg-turmeric/5 flex flex-col lg:flex-row gap-4 items-center border-t-4 border-turmeric/20">
                    <div className="flex-1 w-full relative">
                      <input 
                        type="text" 
                        placeholder="Add other food (e.g. Almonds)" 
                        value={customItem}
                        onChange={e => setCustomItem(e.target.value)}
                        className="input-field pr-12 text-sm md:text-base"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-leaf-dark/20">
                        <Utensils size={18} className="md:w-5 md:h-5" />
                      </div>
                    </div>
                    <button 
                      onClick={addCustomItem}
                      className="w-full lg:w-auto bg-leaf-medium text-white px-8 md:px-12 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-leaf-dark transition-all shadow-xl active:scale-95 text-sm md:text-base"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between pt-8 gap-4">
                <button onClick={handleBack} className="tamil-btn-outline w-full sm:w-auto"><ChevronLeft size={20} /> Back</button>
                <button 
                  onClick={generatePlan}
                  disabled={loading}
                  className="tamil-btn px-10 md:px-16 py-4 md:py-6 text-xl md:text-2xl shadow-leaf-dark/20 shadow-2xl disabled:opacity-50 w-full sm:w-auto"
                >
                  {loading ? 'Cooking...' : 'Generate Plan'} <ArrowRight size={28} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && plan && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12 bg-white p-8 rounded-[3rem] shadow-xl border border-leaf-dark/5">
                <div>
                  <h2 className="text-4xl font-bold text-leaf-dark">{plan.planName}</h2>
                  <p className="text-leaf-dark/60 font-medium">Personalized 7-Day Tamil Diet Plan</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {paid && (
                    <>
                      <button 
                        onClick={downloadPDF}
                        className="tamil-btn-outline !py-3 !px-6 !text-sm"
                      >
                        <Download size={18} /> Download PDF
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="tamil-btn-outline !py-3 !px-6 !text-sm hidden md:flex"
                      >
                        <Utensils size={18} /> Print Plan
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => { setStep(0); setPlan(null); setPaid(false); }}
                    className="tamil-btn !py-3 !px-6 !text-sm"
                  >
                    <RefreshCw size={18} /> New Plan
                  </button>
                </div>
              </div>

              <div id="meal-plan-content" className="space-y-12 bg-leaf-light p-4 md:p-8 rounded-[3rem]">
                {/* Preview Mode */}
              {!paid && !paymentStep && (
                <div className="space-y-12">
                  <div className="text-center">
                    <span className="bg-leaf-medium/10 text-leaf-medium px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Free Sample: Day 1</span>
                  </div>
                  
                  <div className="max-w-xl mx-auto">
                    {plan.days.slice(0, 1).map((day: any, idx: number) => (
                      <DayCard key={idx} day={day} profile={profile} formatText={formatText} />
                    ))}
                  </div>

                  <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-20 pointer-events-none blur-xl grayscale">
                      {plan.days.slice(1, 4).map((day: any, idx: number) => (
                        <div key={idx} className="banana-leaf-card p-10 space-y-6">
                          <h3 className="font-bold text-3xl text-leaf-dark">{day.day}</h3>
                          <div className="space-y-4">
                            <div className="h-4 bg-leaf-dark/10 rounded w-3/4" />
                            <div className="h-4 bg-leaf-dark/10 rounded w-1/2" />
                            <div className="h-4 bg-leaf-dark/10 rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center z-10 p-4 -mt-20">
                      <div className="bg-white p-12 rounded-[3.5rem] border-4 border-leaf-dark shadow-[0_40px_80px_-15px_rgba(27,77,27,0.4)] text-center max-w-xl space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-3 bg-turmeric" />
                        <div className="w-28 h-28 bg-leaf-light rounded-3xl flex items-center justify-center text-leaf-dark mx-auto shadow-inner rotate-3">
                          <Wallet size={48} />
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-4xl font-bold text-leaf-dark">Unlock Your Full Plan</h3>
                          <p className="text-lg text-[rgba(27,58,27,0.6)] leading-relaxed">Choose a plan to get the complete 7-day or 30-day meal plan, grocery list, and nutrition tips.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button 
                            onClick={() => handlePayment('7-day')}
                            className="bg-white border-4 border-leaf-dark p-6 rounded-2xl text-left hover:bg-leaf-light transition-all group"
                          >
                            <p className="text-[10px] font-black uppercase tracking-widest text-leaf-medium">Standard</p>
                            <h4 className="text-2xl font-black text-leaf-dark">7-Day Plan</h4>
                            <p className="text-3xl font-black text-leaf-dark mt-2">₹20</p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-[rgba(27,58,27,0.4)]">
                              <Check size={12} /> Full Access
                            </div>
                          </button>
                          
                          <button 
                            onClick={() => handlePayment('30-day')}
                            className="bg-leaf-dark border-4 border-leaf-dark p-6 rounded-2xl text-left hover:bg-leaf-dark/90 transition-all group relative overflow-hidden"
                          >
                            <div className="absolute top-2 right-2 bg-turmeric text-leaf-dark text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">Popular</div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Premium</p>
                            <h4 className="text-2xl font-black text-white">Monthly</h4>
                            <p className="text-3xl font-black text-turmeric mt-2">₹50</p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-white/40">
                              <Check size={12} /> 30-Day Cycle
                            </div>
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-3 text-[10px] text-leaf-dark/40 uppercase tracking-[0.2em] font-black">
                          <Check size={14} className="text-leaf-medium" />
                          <span>Instant Access • Secure UPI</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Step */}
              {paymentStep && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-10 rounded-[3rem] border-4 border-leaf-dark shadow-2xl space-y-10 max-w-md mx-auto relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-turmeric/10 rounded-full -mr-16 -mt-16" />
                  <div className="flex justify-between items-center border-b border-leaf-dark/5 pb-6">
                    <h3 className="text-2xl font-bold text-leaf-dark">Secure Checkout</h3>
                    <button onClick={() => setPaymentStep(false)} className="text-leaf-dark/40 hover:text-leaf-dark transition-colors">
                      <ChevronLeft size={24} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-leaf-light rounded-2xl space-y-4">
                      <div className="flex justify-between text-lg">
                        <span className="text-leaf-dark/60 font-medium">{selectedPlan === '7-day' ? '7-Day Plan' : 'Monthly Access'}</span>
                        <span className="font-black text-leaf-dark">₹{selectedPlan === '7-day' ? '20.00' : '50.00'}</span>
                      </div>
                      <div className="flex justify-between text-sm text-leaf-dark/40">
                        <span>GST (Included)</span>
                        <span>₹0.00</span>
                      </div>
                      <div className="border-t border-leaf-dark/10 pt-4 flex justify-between text-2xl font-black">
                        <span className="text-leaf-dark">Total</span>
                        <span className="text-leaf-dark">₹{selectedPlan === '7-day' ? '20.00' : '50.00'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={confirmPayment}
                      className="w-full bg-leaf-dark text-white py-6 rounded-2xl font-black flex items-center justify-center gap-4 hover:bg-leaf-dark/90 transition-all shadow-xl active:scale-95"
                    >
                      <CreditCard size={24} /> Pay with Card (அட்டை மூலம்)
                    </button>
                    <button 
                      onClick={confirmPayment}
                      className="w-full border-4 border-leaf-dark text-leaf-dark py-6 rounded-2xl font-black flex items-center justify-center gap-4 hover:bg-leaf-dark/5 transition-all active:scale-95"
                    >
                      <span className="text-2xl italic">UPI</span> Pay with Any App (UPI மூலம்)
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-xs text-leaf-dark/40 font-black uppercase tracking-widest">
                    <Check size={16} className="text-leaf-medium" />
                    <span>SSL Encrypted & Authentic</span>
                  </div>
                </motion.div>
              )}

              {/* Full Plan View */}
              {paid && (
                <div className="space-y-16">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <h2 className="text-3xl md:text-5xl font-black text-leaf-dark tracking-tighter text-center md:text-left">Your Personalized Plan</h2>
                    <div className="px-4 py-2 bg-leaf-light rounded-full border border-[rgba(27,77,27,0.1)]">
                      <p className="text-[8px] md:text-[10px] font-black text-leaf-dark uppercase tracking-widest">Bilingual: Tamil + English</p>
                    </div>
                  </div>

                  {/* Nutrition Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[
                      { label: 'Avg Calories', val: '1850 kcal', icon: <Flame size={18} /> },
                      { label: 'Protein Focus', val: 'High', icon: <Zap size={18} /> },
                      { label: 'Diet Type', val: profile.dietType.join(', '), icon: <Utensils size={18} /> },
                      { label: 'Duration', val: `${plan.days.length} Days`, icon: <Clock size={18} /> },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-4 md:p-6 rounded-3xl border border-leaf-dark/5 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-leaf-light rounded-xl flex items-center justify-center text-leaf-dark mb-3">
                          {stat.icon}
                        </div>
                        <p className="text-[10px] font-black uppercase text-leaf-dark/40 tracking-widest">{stat.label}</p>
                        <p className="font-bold text-sm md:text-base text-leaf-dark capitalize truncate w-full">{stat.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-12">
                    {selectedPlan === '30-day' ? (
                      // 30-Day Plan grouped by weeks
                      <div className="space-y-16">
                        {Array.from({ length: Math.ceil(plan.days.length / 7) }).map((_, weekIdx) => {
                          const weekDays = plan.days.slice(weekIdx * 7, (weekIdx + 1) * 7);
                          if (weekDays.length === 0) return null;
                          return (
                            <div key={weekIdx} className="space-y-8">
                              <div className="flex items-center gap-4">
                                <div className="h-px bg-leaf-dark/10 flex-grow" />
                                <div className="px-6 py-2 bg-leaf-dark text-white rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
                                  Week {weekIdx + 1}
                                </div>
                                <div className="h-px bg-leaf-dark/10 flex-grow" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                                {weekDays.map((day: any, idx: number) => (
                                  <DayCard key={idx} day={day} profile={profile} formatText={formatText} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // 7-Day Plan
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                        {plan.days.map((day: any, idx: number) => (
                          <DayCard key={idx} day={day} profile={profile} formatText={formatText} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    <div className="bg-leaf-dark text-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 md:space-y-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(255,255,255,0.05)] rounded-full -mr-32 -mt-32" />
                      <div className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-[rgba(255,255,255,0.1)] rounded-2xl flex items-center justify-center text-turmeric">
                          <ShoppingCart size={24} className="md:w-8 md:h-8" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-black">Grocery List</h3>
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative">
                        {plan.groceryList.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 md:gap-4 text-[rgba(255,255,255,0.8)] group">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 border-[rgba(255,255,255,0.2)] flex-shrink-0 mt-0.5 group-hover:border-turmeric transition-colors" />
                            <span className="font-bold text-sm md:text-base">{formatText(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-turmeric p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 md:space-y-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[rgba(0,0,0,0.05)] rounded-full -ml-32 -mb-32" />
                      <div className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-[rgba(0,0,0,0.1)] rounded-2xl flex items-center justify-center text-leaf-dark">
                          <Info size={24} className="md:w-8 md:h-8" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-black text-leaf-dark">Health Tips</h3>
                      </div>
                      <div className="space-y-4 md:space-y-6 relative">
                        {plan.tips.map((tip: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 md:gap-6 bg-[rgba(255,255,255,0.4)] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[rgba(255,255,255,0.2)]">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-leaf-dark text-white flex items-center justify-center flex-shrink-0 font-black shadow-lg text-sm md:text-base">
                              {i + 1}
                            </div>
                            <p className="text-leaf-dark font-black italic leading-relaxed text-sm md:text-base">{formatText(tip)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestions Section */}
                  {plan.aiSuggestions && (
                    <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border-2 border-[rgba(27,77,27,0.1)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden">
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-leaf-light rounded-full opacity-20" />
                      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 md:mb-10 relative text-center sm:text-left">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-leaf-dark rounded-2xl flex items-center justify-center text-turmeric flex-shrink-0">
                          <Zap size={24} className="md:w-8 md:h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-4xl font-black text-leaf-dark">AI Smart Suggestions</h3>
                          <p className="text-leaf-medium font-bold text-sm md:text-base">Personalized habits & lifestyle hacks</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative">
                        {plan.aiSuggestions.map((suggestion: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-4 md:p-6 bg-[rgba(241,248,233,0.3)] rounded-2xl md:rounded-3xl border border-[rgba(27,77,27,0.05)]">
                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-leaf-dark shadow-sm flex-shrink-0">
                              <Star size={16} fill="currentColor" />
                            </div>
                            <p className="text-leaf-dark font-medium leading-relaxed text-sm md:text-base">{formatText(suggestion)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center py-12">
                    <button 
                      onClick={downloadPDF}
                      className="tamil-btn px-16 py-6 text-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
                    >
                      Download PDF <ArrowRight size={28} />
                    </button>
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-10 md:p-20 bg-leaf-dark text-[rgba(255,255,255,0.4)] text-sm border-t-8 border-turmeric">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-20">
          <div className="space-y-6 md:space-y-8 col-span-1 sm:col-span-2">
            <div className="flex items-center gap-3 text-white">
              <Leaf size={32} className="text-leaf-medium" />
              <h2 className="text-2xl md:text-3xl font-black">TamilDiet</h2>
            </div>
            <p className="max-w-xs text-lg md:text-xl leading-relaxed font-medium">Empowering Tamil Nadu with personalized, affordable, and authentic nutrition plans. தமிழ் உணவியல் உங்கள் ஆரோக்கியத்திற்கு.</p>
            <div className="flex gap-4">
              {['Heart', 'Zap', 'Star'].map((iconName, i) => {
                const Icon = iconName === 'Heart' ? Heart : iconName === 'Zap' ? Zap : Star;
                return (
                  <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer text-white">
                    <Icon size={20} className="md:w-6 md:h-6" />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-6 md:space-y-8">
            <h3 className="text-white font-black uppercase tracking-widest text-xs">Quick Links</h3>
            <ul className="space-y-3 md:space-y-4 font-black text-[10px] md:text-xs uppercase tracking-widest">
              <li><a href="#" className="hover:text-leaf-medium transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-leaf-medium transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-leaf-medium transition-colors">Refund Policy</a></li>
            </ul>
          </div>
          <div className="space-y-6 md:space-y-8">
            <h3 className="text-white font-black uppercase tracking-widest text-xs">Contact</h3>
            <div className="space-y-3 md:space-y-4 font-black text-[10px] md:text-xs uppercase tracking-widest">
              <p className="text-white">Chennai, Tamil Nadu</p>
              <p className="text-leaf-medium">support@diet.in</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 md:mt-20 pt-12 md:pt-20 border-t border-[rgba(255,255,255,0.05)] text-center">
          <p className="font-black uppercase tracking-widest text-[8px] md:text-[10px]">© 2026 TamilDiet. Crafted with ❤️ for Tamil Nadu.</p>
        </div>
      </footer>

      {/* Payment Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-leaf-dark text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-turmeric"
          >
            <div className="w-8 h-8 bg-turmeric rounded-full flex items-center justify-center text-leaf-dark">
              <Check size={20} strokeWidth={4} />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Payment Successful!</p>
              <p className="text-[10px] opacity-60">செலுத்துதல் வெற்றிகரமாக முடிந்தது</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-leaf-dark/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center space-y-10">
          <div className="relative w-32 h-32">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-8 border-leaf-medium/10 border-t-leaf-medium rounded-[2.5rem]"
            />
            <div className="absolute inset-0 flex items-center justify-center text-leaf-medium">
              <Leaf size={48} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-4">
            <p className="text-4xl font-black text-white tracking-tight drop-shadow-2xl">Preparing your plan...</p>
            <p className="text-turmeric font-black uppercase tracking-[0.4em] text-xs">தமிழ் உணவியல் தயாராகிறது</p>
          </div>
        </div>
      )}
    </div>
  );
}
