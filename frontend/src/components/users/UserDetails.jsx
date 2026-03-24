import {
    Briefcase, MapPin, Phone, Mail, Calendar, Award,
    BookOpen, ExternalLink, Github, FileText, Clock,
    User, Building2, GraduationCap, CreditCard,
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

// ── Compact info field ─────────────────────────────────────────────────────
const Field = ({ icon: Icon, label, value }) => {
    if (!value) return null
    return (
        <div className="flex items-start gap-2 min-w-0">
            <div className="mt-0.5 shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-primary-50 dark:bg-primary-950/50">
                <Icon size={12} className="text-primary-500 dark:text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-app-muted leading-none mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-app-primary leading-snug break-words">{value}</p>
            </div>
        </div>
    )
}

const SectionTitle = ({ children }) => (
    <p className="text-xs font-bold text-app-muted uppercase tracking-wider mb-3 pb-1.5 border-b border-app">
        {children}
    </p>
)

export default function UserDetails({ user }) {
    if (!user) return null

    const age = user.date_of_birth
        ? Math.floor((new Date() - new Date(user.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null

    const employmentLabels = {
        full_time:   'Full Time',
        part_time:   'Part Time',
        contract :   'Contract',
        internship:  'Internship',
    }

    return (
        <div className="flex flex-col gap-0 rounded-2xl overflow-hidden border border-app">

            {/* ── HERO BANNER ─────────────────────────────────────────────── */}
            <div
                className="relative p-5"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)' }}
            >
                <div className="relative flex items-center gap-4 flex-wrap">
                    {/* Avatar */}
                    <div className="w-40 h-40 rounded-full ring-1 ring-white/30 overflow-hidden shrink-0">
                        {user.avatar
                            ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            : (
                                <div className="w-full h-full flex items-center justify-center text-app-primary text-xl font-bold"
                                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                                    {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                            )
                        }
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-app-primary leading-tight truncate"
                            style={{ fontFamily: 'Syne, sans-serif' }}>
                            {user.name}
                        </h2>
                        {user.job_title && (
                            <p className="text-sm text-app-primary mt-0.5 truncate">{user.job_title}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-black/20 text-app-primary capitalize">
                                {user.role}
                            </span>
                            {user.employment_type && (
                                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-black/15 text-app-primary">
                                    {employmentLabels[user.employment_type]}
                                </span>
                            )}
                            {user.contract_type && (
                                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-black/20 text-app-primary">
                                    {user.contract_type}
                                </span>
                            )}
                            {user.years_of_experience >= 0 && (
                                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-black/15 text-app-primary">
                                    {user.years_of_experience} yrs exp
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Salary */}
                    {user.salary && (
                        <div className="shrink-0 bg-black/15 rounded-xl px-4 py-2.5 text-center">
                            <p className="text-xs text-app-primary/60 font-medium leading-none mb-0.5">Salary</p>
                            <p className="text-base font-bold text-app-primary leading-tight">
                                {Number(user.salary).toLocaleString('fr-MA')}
                            </p>
                            <p className="text-xs text-app-primary/60 leading-none mt-0.5">MAD / mo</p>
                        </div>
                    )}
                </div>

                {/* Contact row */}
                <div className="relative flex flex-wrap gap-4 mt-3 pt-3 border-t border-app">
                    {user.email && (
                        <div className="flex items-center gap-1.5 text-app-primary/80 text-xs">
                            <Mail size={11} /><span>{user.email}</span>
                        </div>
                    )}
                    {user.phone_number && (
                        <div className="flex items-center gap-1.5 text-app-primary/80 text-xs">
                            <Phone size={11} /><span>{user.phone_number}</span>
                        </div>
                    )}
                    {user.address && (
                        <div className="flex items-center gap-1.5 text-app-primary/80 text-xs">
                            <MapPin size={11} /><span className="truncate max-w-48">{user.address}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── BODY — 4-column info grid ──────────────────────────────── */}
            <div className="bg-card p-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">

                    {/* Professional */}
                    <div>
                        <SectionTitle>Professional</SectionTitle>
                        <div className="flex flex-col gap-3">
                            <Field icon={Briefcase}  label="Job Title"   value={user.job_title} />
                            <Field icon={Clock}      label="Experience"  value={user.years_of_experience ? `${user.years_of_experience} years` : null} />
                            <Field icon={Calendar}   label="Hire Date"   value={formatDate(user.hire_date)} />
                        </div>
                    </div>

                    {/* Contract */}
                    <div>
                        <SectionTitle>Contract</SectionTitle>
                        <div className="flex flex-col gap-3">
                            <Field icon={FileText}  label="Type"   value={user.contract_type} />
                            <Field icon={Calendar}  label="Start"  value={formatDate(user.contract_start_date)} />
                            <Field icon={Calendar}  label="End"    value={formatDate(user.contract_end_date) || (user.contract_type === 'CDI' ? 'Permanent' : null)} />
                        </div>
                    </div>

                    {/* Personal */}
                    <div>
                        <SectionTitle>Personal</SectionTitle>
                        <div className="flex flex-col gap-3">
                            <Field icon={User}       label="Date of Birth"  value={user.date_of_birth ? `${formatDate(user.date_of_birth)}${age ? ` (${age} yrs)` : ''}` : null} />
                            <Field icon={FileText}   label="CIN / NID"      value={user.national_id} />
                            <Field icon={CreditCard} label="Employment"     value={employmentLabels[user.employment_type]} />
                        </div>
                    </div>

                    {/* Education */}
                    <div>
                        <SectionTitle>Education</SectionTitle>
                        <div className="flex flex-col gap-3">
                            <Field icon={GraduationCap} label="Level"          value={user.education_level} />
                            <Field icon={BookOpen}      label="Field of Study"  value={user.field_of_study} />
                            <Field icon={Building2}     label="University"      value={user.university} />
                        </div>
                    </div>
                </div>

                {/* Skills & Online */}
                {(user.certifications || user.linkedin_url || user.github_url) && (
                    <div className="mt-5 pt-4 border-t border-app">
                        <SectionTitle>Skills &amp; Online</SectionTitle>
                        <div className="flex flex-wrap gap-2">
                            {user.certifications && user.certifications.split(',').map((cert, i) => (
                                <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300">
                                    <Award size={11} />{cert.trim()}
                                </span>
                            ))}
                            {user.linkedin_url && (
                                <a href={user.linkedin_url} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:opacity-80 transition-opacity">
                                    <ExternalLink size={11} />LinkedIn
                                </a>
                            )}
                            {user.github_url && (
                                <a href={user.github_url} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:opacity-80 transition-opacity">
                                    <Github size={11} />GitHub
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
