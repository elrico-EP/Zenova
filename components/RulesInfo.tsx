
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

export const RulesInfo: React.FC = () => {
    const t = useTranslations();
    const rules = t.rules;

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-3 text-gray-700">{t.planningGuide}</h3>
            <div className="space-y-4">
                {rules.map((section, index) => (
                    <div key={index}>
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">{section.title}</h4>
                        <ul className="space-y-1 list-disc list-inside text-sm text-gray-600 pl-2">
                            {section.items.map((item, itemIndex) => (
                                <li key={itemIndex}>{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};