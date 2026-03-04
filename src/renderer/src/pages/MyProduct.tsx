import { useEffect, useState } from 'react'
import { useProductStore } from '../stores/productStore'
import type { ProductSetupStep } from '../types/product'
import { Package, Target, Shield, Users, DollarSign, Check, ChevronRight, ChevronLeft, Plus, X, Sparkles } from 'lucide-react'

const STEPS: { key: ProductSetupStep; label: string; icon: typeof Package }[] = [
  { key: 'basics', label: 'Basics', icon: Package },
  { key: 'benefits', label: 'Benefits & USPs', icon: Sparkles },
  { key: 'target', label: 'Target Market', icon: Target },
  { key: 'objections', label: 'Objections', icon: Shield },
  { key: 'competitors', label: 'Competitors & Pricing', icon: DollarSign }
]

const PRODUCT_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'software', label: 'Software / SaaS' },
  { value: 'physical', label: 'Physical Product' },
  { value: 'consulting', label: 'Consulting' }
]

const INDUSTRY_SUGGESTIONS = [
  'Restaurants', 'Retail', 'Healthcare', 'Real Estate', 'Construction',
  'Legal', 'Dental', 'Automotive', 'Fitness', 'Beauty & Spa',
  'Home Services', 'Financial Services', 'Education', 'Technology',
  'Manufacturing', 'Hospitality', 'Insurance', 'Accounting'
]

export default function MyProduct() {
  const { product, loading, load, update } = useProductStore()
  const [step, setStep] = useState<ProductSetupStep>('basics')
  const [saving, setSaving] = useState(false)

  // Local form state
  const [productName, setProductName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [productType, setProductType] = useState('')
  const [elevatorPitch, setElevatorPitch] = useState('')
  const [website, setWebsite] = useState('')
  const [keyBenefits, setKeyBenefits] = useState<string[]>([])
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState<string[]>([])
  const [targetIndustries, setTargetIndustries] = useState<string[]>([])
  const [targetBusinessSizes, setTargetBusinessSizes] = useState('')
  const [idealCustomerDescription, setIdealCustomerDescription] = useState('')
  const [commonObjections, setCommonObjections] = useState<{ objection: string; response: string }[]>([])
  const [competitors, setCompetitors] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState('')

  // Temp inputs for adding items
  const [newBenefit, setNewBenefit] = useState('')
  const [newUSP, setNewUSP] = useState('')
  const [newCompetitor, setNewCompetitor] = useState('')
  const [newObjection, setNewObjection] = useState('')
  const [newResponse, setNewResponse] = useState('')

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (product) {
      setProductName(product.product_name || '')
      setCompanyName(product.company_name || '')
      setProductType(product.product_type || '')
      setElevatorPitch(product.elevator_pitch || '')
      setWebsite(product.website || '')
      setKeyBenefits(product.key_benefits || [])
      setUniqueSellingPoints(product.unique_selling_points || [])
      setTargetIndustries(product.target_industries || [])
      setTargetBusinessSizes(product.target_business_sizes || '')
      setIdealCustomerDescription(product.ideal_customer_description || '')
      setCommonObjections(product.common_objections || [])
      setCompetitors(product.competitors || [])
      setPriceRange(product.price_range || '')
    }
  }, [product])

  const handleSave = async () => {
    setSaving(true)
    try {
      await update({
        product_name: productName,
        company_name: companyName,
        product_type: productType as any,
        elevator_pitch: elevatorPitch,
        website,
        key_benefits: keyBenefits,
        unique_selling_points: uniqueSellingPoints,
        target_industries: targetIndustries,
        target_business_sizes: targetBusinessSizes,
        ideal_customer_description: idealCustomerDescription,
        common_objections: commonObjections,
        competitors,
        price_range: priceRange
      })
    } finally {
      setSaving(false)
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  const goNext = async () => {
    await handleSave()
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].key)
  }

  const goPrev = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">My Product</h1>
        <p className="text-sm text-gray-400 mt-1">Configure what you sell. This powers all AI-generated scripts, call prep, and outreach.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = s.key === step
          const isPast = i < stepIndex
          return (
            <button
              key={s.key}
              onClick={() => setStep(s.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-gold/10 text-gold border border-gold/30'
                  : isPast
                    ? 'bg-navy-700 text-green-400 border border-green-500/20'
                    : 'bg-navy-800 text-gray-500 border border-transparent hover:border-navy-600'
              }`}
            >
              {isPast ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              <span className="hidden lg:inline">{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* Step content */}
      <div className="card">
        {step === 'basics' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">The Basics</h2>
            <p className="text-sm text-gray-400">Tell us about your company and what you offer.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Company Name</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-field w-full" placeholder="e.g. Tekta.ai" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Product / Service Name</label>
                <input value={productName} onChange={(e) => setProductName(e.target.value)} className="input-field w-full" placeholder="e.g. AI Website Builder" />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Product Type</label>
              <div className="flex gap-2">
                {PRODUCT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setProductType(t.value)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      productType === t.value
                        ? 'bg-gold/20 text-gold border border-gold/30'
                        : 'bg-navy-800 text-gray-400 border border-navy-600 hover:border-navy-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Elevator Pitch (2-3 sentences)</label>
              <textarea
                value={elevatorPitch}
                onChange={(e) => setElevatorPitch(e.target.value)}
                rows={3}
                className="input-field w-full resize-none"
                placeholder="We help [target market] achieve [outcome] by [method]. Unlike [alternatives], we [differentiator]."
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className="input-field w-full" placeholder="https://yourcompany.com" />
            </div>
          </div>
        )}

        {step === 'benefits' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Benefits & USPs</h2>
            <p className="text-sm text-gray-400">What makes your product valuable and unique?</p>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Key Benefits</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {keyBenefits.map((b, i) => (
                  <span key={i} className="bg-navy-700 text-gray-300 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {b}
                    <button onClick={() => setKeyBenefits(keyBenefits.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newBenefit.trim()) {
                      setKeyBenefits([...keyBenefits, newBenefit.trim()])
                      setNewBenefit('')
                    }
                  }}
                  className="input-field flex-1"
                  placeholder="e.g. Saves 10 hours per week"
                />
                <button
                  onClick={() => { if (newBenefit.trim()) { setKeyBenefits([...keyBenefits, newBenefit.trim()]); setNewBenefit('') } }}
                  className="btn-outline"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Unique Selling Points</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {uniqueSellingPoints.map((u, i) => (
                  <span key={i} className="bg-gold/10 text-gold px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {u}
                    <button onClick={() => setUniqueSellingPoints(uniqueSellingPoints.filter((_, j) => j !== i))} className="text-gold/50 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newUSP}
                  onChange={(e) => setNewUSP(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newUSP.trim()) {
                      setUniqueSellingPoints([...uniqueSellingPoints, newUSP.trim()])
                      setNewUSP('')
                    }
                  }}
                  className="input-field flex-1"
                  placeholder="e.g. Only solution with AI-powered cold calling"
                />
                <button
                  onClick={() => { if (newUSP.trim()) { setUniqueSellingPoints([...uniqueSellingPoints, newUSP.trim()]); setNewUSP('') } }}
                  className="btn-outline"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'target' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Target Market</h2>
            <p className="text-sm text-gray-400">Who are your ideal customers?</p>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Target Industries</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {targetIndustries.map((ind, i) => (
                  <span key={i} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {ind}
                    <button onClick={() => setTargetIndustries(targetIndustries.filter((_, j) => j !== i))} className="text-blue-400/50 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {INDUSTRY_SUGGESTIONS.filter((s) => !targetIndustries.includes(s)).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTargetIndustries([...targetIndustries, s])}
                    className="text-xs bg-navy-800 text-gray-500 px-2 py-1 rounded hover:bg-navy-700 hover:text-gray-300"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Target Business Sizes</label>
              <input
                value={targetBusinessSizes}
                onChange={(e) => setTargetBusinessSizes(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. Small businesses (1-50 employees), local shops"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Ideal Customer Description</label>
              <textarea
                value={idealCustomerDescription}
                onChange={(e) => setIdealCustomerDescription(e.target.value)}
                rows={3}
                className="input-field w-full resize-none"
                placeholder="Describe your perfect customer - their role, pain points, what makes them buy..."
              />
            </div>
          </div>
        )}

        {step === 'objections' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Common Objections</h2>
            <p className="text-sm text-gray-400">What pushback do you typically hear? Add objections with your best responses.</p>

            <div className="space-y-3">
              {commonObjections.map((obj, i) => (
                <div key={i} className="bg-navy-800 rounded-lg p-3 border border-navy-600">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-red-400 font-medium">"{obj.objection}"</p>
                      <p className="text-sm text-green-400 mt-1">{obj.response}</p>
                    </div>
                    <button
                      onClick={() => setCommonObjections(commonObjections.filter((_, j) => j !== i))}
                      className="text-gray-500 hover:text-red-400 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-navy-900 rounded-lg p-3 space-y-2 border border-navy-700">
              <input
                value={newObjection}
                onChange={(e) => setNewObjection(e.target.value)}
                className="input-field w-full"
                placeholder="Objection: e.g. It's too expensive"
              />
              <textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                rows={2}
                className="input-field w-full resize-none"
                placeholder="Your response: e.g. I understand budget is a concern. Let me show you the ROI..."
              />
              <button
                onClick={() => {
                  if (newObjection.trim() && newResponse.trim()) {
                    setCommonObjections([...commonObjections, { objection: newObjection.trim(), response: newResponse.trim() }])
                    setNewObjection('')
                    setNewResponse('')
                  }
                }}
                className="btn-outline text-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Objection
              </button>
            </div>
          </div>
        )}

        {step === 'competitors' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Competitors & Pricing</h2>
            <p className="text-sm text-gray-400">Know your competition and position your pricing.</p>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Competitors</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {competitors.map((c, i) => (
                  <span key={i} className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {c}
                    <button onClick={() => setCompetitors(competitors.filter((_, j) => j !== i))} className="text-red-400/50 hover:text-red-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCompetitor.trim()) {
                      setCompetitors([...competitors, newCompetitor.trim()])
                      setNewCompetitor('')
                    }
                  }}
                  className="input-field flex-1"
                  placeholder="e.g. Competitor Co."
                />
                <button
                  onClick={() => { if (newCompetitor.trim()) { setCompetitors([...competitors, newCompetitor.trim()]); setNewCompetitor('') } }}
                  className="btn-outline"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Price Range</label>
              <input
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. $500-$2000/month or $5000 one-time"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="btn-ghost flex items-center gap-2 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-outline">
            {saving ? 'Saving...' : 'Save'}
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button onClick={goNext} className="btn-gold flex items-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} className="btn-gold flex items-center gap-2">
              <Check className="w-4 h-4" /> Finish Setup
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
