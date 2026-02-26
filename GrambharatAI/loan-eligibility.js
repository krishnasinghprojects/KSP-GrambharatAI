const fs = require('fs');
const path = require('path');

// CIBIL Score Calculation (300-900 scale)
function calculateCIBILScore(profile) {
    const { creditHistory, liabilities, income, assets } = profile;
    
    // Base score
    let score = 300;
    
    // 1. Payment History (35% weight) - Max 210 points
    const totalPayments = creditHistory.onTimePayments + creditHistory.latePayments + creditHistory.missedPayments;
    const paymentScore = totalPayments > 0 
        ? (creditHistory.onTimePayments / totalPayments) * 210
        : 0;
    
    // Penalty for defaults
    const defaultPenalty = creditHistory.totalDefaults * 50;
    const recentDefaultPenalty = creditHistory.recentDefaults * 80;
    
    score += Math.max(0, paymentScore - defaultPenalty - recentDefaultPenalty);
    
    // 2. Credit Utilization (30% weight) - Max 180 points
    const totalIncome = income.totalMonthlyIncome;
    const totalEMI = liabilities.monthlyEMI;
    const utilizationRatio = totalIncome > 0 ? totalEMI / totalIncome : 1;
    
    let utilizationScore = 0;
    if (utilizationRatio < 0.3) utilizationScore = 180;
    else if (utilizationRatio < 0.4) utilizationScore = 150;
    else if (utilizationRatio < 0.5) utilizationScore = 100;
    else if (utilizationRatio < 0.6) utilizationScore = 50;
    else utilizationScore = 0;
    
    score += utilizationScore;
    
    // 3. Credit History Length (15% weight) - Max 90 points
    const historyYears = creditHistory.oldestAccountYears;
    let historyScore = 0;
    if (historyYears >= 10) historyScore = 90;
    else if (historyYears >= 5) historyScore = 70;
    else if (historyYears >= 3) historyScore = 50;
    else if (historyYears >= 1) historyScore = 30;
    else historyScore = 10;
    
    score += historyScore;
    
    // 4. Income Stability (10% weight) - Max 60 points
    let stabilityScore = 0;
    const employmentYears = income.employmentYears || income.businessYears || 0;
    
    if (income.incomeStability === "Very Stable") stabilityScore = 60;
    else if (income.incomeStability === "Stable") stabilityScore = 50;
    else if (income.incomeStability === "Regular") stabilityScore = 40;
    else if (income.incomeStability === "Seasonal") stabilityScore = 25;
    else stabilityScore = 10;
    
    // Bonus for long employment
    if (employmentYears >= 10) stabilityScore += 10;
    else if (employmentYears >= 5) stabilityScore += 5;
    
    score += Math.min(60, stabilityScore);
    
    // 5. Asset Coverage (10% weight) - Max 60 points
    const assetToDebtRatio = liabilities.totalDebt > 0 
        ? assets.totalAssets / liabilities.totalDebt 
        : 100;
    
    let assetScore = 0;
    if (assetToDebtRatio >= 20) assetScore = 60;
    else if (assetToDebtRatio >= 10) assetScore = 50;
    else if (assetToDebtRatio >= 5) assetScore = 40;
    else if (assetToDebtRatio >= 2) assetScore = 25;
    else assetScore = 10;
    
    score += assetScore;
    
    // Penalty for recent credit inquiries
    if (creditHistory.creditInquiries > 5) score -= 20;
    else if (creditHistory.creditInquiries > 3) score -= 10;
    
    // Ensure score is within 300-900 range
    score = Math.max(300, Math.min(900, Math.round(score)));
    
    return score;
}

// Loan Eligibility Check
function checkLoanEligibility(personName, requestedAmount) {
    try {
        // Normalize name for file lookup
        const fileName = personName.toLowerCase().replace(/\s+/g, '-') + '.json';
        const filePath = path.join(__dirname, 'financial-profiles', fileName);
        
        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                error: `Financial profile not found for ${personName}. Available profiles: Ram Vilas, Phool Kumari, Sita Devi, Mohan Lal, Radha Sharma`
            };
        }
        
        const profile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Calculate CIBIL Score
        const cibilScore = calculateCIBILScore(profile);
        
        // Calculate key metrics
        const monthlyIncome = profile.income.totalMonthlyIncome;
        const currentEMI = profile.liabilities.monthlyEMI;
        const monthlyExpenses = profile.expenses.totalMonthlyExpenses;
        const disposableIncome = monthlyIncome - currentEMI - monthlyExpenses;
        
        // Calculate new EMI (assuming 10% interest, 5 years)
        const monthlyInterestRate = 0.10 / 12;
        const tenure = 60; // 5 years
        const newEMI = (requestedAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenure)) / 
                       (Math.pow(1 + monthlyInterestRate, tenure) - 1);
        
        const totalEMI = currentEMI + newEMI;
        const debtToIncomeRatio = (totalEMI / monthlyIncome) * 100;
        
        // Determine maximum eligible loan amount with padding
        let maxLoanMultiplier = 0;
        if (cibilScore >= 750) maxLoanMultiplier = 25; // Increased from 20
        else if (cibilScore >= 700) maxLoanMultiplier = 18; // New tier
        else if (cibilScore >= 650) maxLoanMultiplier = 12; // Increased from 10
        else if (cibilScore >= 600) maxLoanMultiplier = 8; // New tier
        else if (cibilScore >= 550) maxLoanMultiplier = 6; // Increased from 5
        else maxLoanMultiplier = 3; // Increased from 2
        
        // Calculate max based on disposable income (more realistic)
        const safeEMI = disposableIncome * 0.5; // Use 50% of disposable income for EMI
        const maxByIncome = (safeEMI * tenure) / (1 + (monthlyInterestRate * tenure / 2)); // Simplified calculation
        
        // Take the lower of the two for safety, but add 20% padding
        const maxEligibleAmount = Math.round(Math.min(monthlyIncome * maxLoanMultiplier, maxByIncome) * 1.2);
        
        // Eligibility decision
        let eligible = true;
        let reasons = [];
        let recommendations = [];
        let criticalFailures = 0; // Track hard rejections
        
        // Check 1: CIBIL Score (Hard check)
        if (cibilScore < 500) {
            eligible = false;
            criticalFailures++;
            reasons.push(`CIBIL score (${cibilScore}) is below minimum requirement of 500`);
            recommendations.push("Improve payment history by clearing existing dues on time");
        } else if (cibilScore < 600) {
            reasons.push(`CIBIL score (${cibilScore}) is in fair range - collateral may be required`);
            recommendations.push("Consider providing collateral to improve loan terms");
        }
        
        // Check 2: Debt-to-Income Ratio (More lenient)
        if (debtToIncomeRatio > 60) {
            eligible = false;
            criticalFailures++;
            reasons.push(`Debt-to-Income ratio (${debtToIncomeRatio.toFixed(1)}%) exceeds maximum limit of 60%`);
            recommendations.push("Pay off existing loans to reduce EMI burden");
        } else if (debtToIncomeRatio > 50) {
            reasons.push(`Debt-to-Income ratio (${debtToIncomeRatio.toFixed(1)}%) is high - interest rate may be higher`);
        }
        
        // Check 3: Requested amount vs eligible amount (More lenient)
        if (requestedAmount > maxEligibleAmount * 1.1) { // Allow 10% over max
            eligible = false;
            criticalFailures++;
            reasons.push(`Requested amount (₹${requestedAmount.toLocaleString('en-IN')}) significantly exceeds maximum eligible amount (₹${maxEligibleAmount.toLocaleString('en-IN')})`);
            recommendations.push(`Consider applying for ₹${maxEligibleAmount.toLocaleString('en-IN')} or less`);
        } else if (requestedAmount > maxEligibleAmount) {
            reasons.push(`Requested amount slightly above recommended limit - may require additional documentation`);
        }
        
        // Check 4: Disposable income after new loan (Rural India adjusted)
        const remainingIncome = disposableIncome - newEMI;
        const minRequired = Math.max(1500, monthlyIncome * 0.05); // At least 1500 or 5% of income
        
        let incomeIssue = false;
        if (remainingIncome < minRequired) {
            incomeIssue = true;
            // Don't mark as critical failure yet - check if assets can compensate
            reasons.push(`Limited disposable income after EMI (₹${Math.round(remainingIncome).toLocaleString('en-IN')})`);
            recommendations.push("Consider reducing loan amount to ₹" + Math.round(maxEligibleAmount * 0.7).toLocaleString('en-IN'));
        } else if (remainingIncome < 2500) {
            reasons.push(`Moderate disposable income after EMI (₹${Math.round(remainingIncome).toLocaleString('en-IN')}) - budget carefully`);
        } else if (remainingIncome < 4000) {
            reasons.push(`Good disposable income after EMI (₹${Math.round(remainingIncome).toLocaleString('en-IN')}) - manageable`);
        } else {
            reasons.push(`Excellent disposable income after EMI (₹${Math.round(remainingIncome).toLocaleString('en-IN')})`);
        }
        
        // Check 5: Recent defaults (Hard check)
        if (profile.creditHistory.recentDefaults > 1) {
            eligible = false;
            criticalFailures++;
            reasons.push(`Multiple recent loan defaults detected (${profile.creditHistory.recentDefaults})`);
            recommendations.push("Clear all defaults and wait 6 months before reapplying");
        } else if (profile.creditHistory.recentDefaults === 1) {
            reasons.push(`One recent default detected - may require guarantor`);
            recommendations.push("Provide a guarantor to strengthen application");
        }
        
        // Check 6: Collateral requirement for large loans (More flexible)
        const collateralRequired = requestedAmount > 300000 && cibilScore < 700; // Increased threshold from 200000
        if (collateralRequired) {
            const availableCollateral = profile.assets.landOwnership.estimatedValue + 
                                       profile.assets.property.estimatedValue + 
                                       profile.assets.gold.estimatedValue;
            
            if (availableCollateral < requestedAmount * 1.2) { // Reduced from 1.5x to 1.2x
                reasons.push(`Limited collateral for loan amount (Required: ₹${(requestedAmount * 1.2).toLocaleString('en-IN')}, Available: ₹${availableCollateral.toLocaleString('en-IN')})`);
                recommendations.push("Provide additional collateral or consider a co-applicant");
            } else {
                reasons.push(`Collateral available (₹${availableCollateral.toLocaleString('en-IN')}) - good security`);
            }
        }
        
        // Override: Asset-backed approval for strong profiles with tight cash flow
        // This helps rural borrowers with strong fundamentals but seasonal income
        if (cibilScore >= 700 && profile.assets.totalAssets > requestedAmount * 2.5 && remainingIncome > 1200) {
            eligible = true;
            reasons.push("✓ Strong credit (CIBIL: " + cibilScore + ") and excellent asset base (₹" + (profile.assets.totalAssets / 100000).toFixed(1) + "L) support approval");
            if (incomeIssue) {
                recommendations.push("Maintain strict budget discipline - consider seasonal income patterns");
            }
        } else if (cibilScore >= 750 && profile.assets.totalAssets > requestedAmount * 2 && remainingIncome > 1500) {
            eligible = true;
            reasons.push("✓ Excellent credit score (CIBIL: " + cibilScore + ") and strong assets compensate for tight cash flow");
        } else if (incomeIssue && remainingIncome < 1200) {
            // Now mark as critical failure if truly insufficient
            eligible = false;
            criticalFailures++;
            recommendations.push("Increase income or reduce requested loan amount");
        }
        
        // Additional override for excellent credit with moderate assets
        if (criticalFailures === 0 && cibilScore >= 800 && profile.assets.totalAssets > requestedAmount * 1.5 && remainingIncome > 1000) {
            eligible = true;
            reasons.push("✓ Exceptional credit history supports approval");
        }
        
        // Positive factors
        if (eligible) {
            if (cibilScore >= 750) reasons.push("✓ Excellent credit score - best interest rates available");
            else if (cibilScore >= 700) reasons.push("✓ Very good credit score - favorable terms");
            else if (cibilScore >= 650) reasons.push("✓ Good credit score");
            
            if (debtToIncomeRatio < 30) reasons.push("✓ Low debt burden - healthy financial position");
            else if (debtToIncomeRatio < 40) reasons.push("✓ Moderate debt burden - manageable");
            
            if (profile.assets.totalAssets > requestedAmount * 3) reasons.push("✓ Excellent asset base - strong security");
            else if (profile.assets.totalAssets > requestedAmount * 2) reasons.push("✓ Strong asset base - good security");
            
            if (profile.income.incomeStability === "Very Stable") reasons.push("✓ Very stable income - reliable repayment capacity");
            else if (profile.income.incomeStability === "Stable") reasons.push("✓ Stable income source");
            
            if (remainingIncome > monthlyIncome * 0.3) reasons.push("✓ Excellent disposable income - comfortable repayment");
            else if (remainingIncome > monthlyIncome * 0.2) reasons.push("✓ Good disposable income");
        }
        
        return {
            success: true,
            applicant: profile.personalInfo.name,
            requestedAmount: requestedAmount,
            eligible: eligible,
            cibilScore: cibilScore,
            maxEligibleAmount: maxEligibleAmount,
            monthlyIncome: monthlyIncome,
            currentEMI: currentEMI,
            newEMI: Math.round(newEMI),
            totalEMI: Math.round(totalEMI),
            debtToIncomeRatio: debtToIncomeRatio.toFixed(1),
            disposableIncome: Math.round(disposableIncome),
            remainingIncome: Math.round(remainingIncome),
            collateralRequired: collateralRequired,
            reasons: reasons,
            recommendations: recommendations,
            profileSummary: {
                age: profile.personalInfo.age,
                occupation: profile.personalInfo.occupation,
                totalAssets: profile.assets.totalAssets,
                totalDebt: profile.liabilities.totalDebt,
                landOwned: profile.assets.landOwnership.acres + " acres"
            }
        };
        
    } catch (error) {
        return {
            success: false,
            error: `Error processing loan eligibility: ${error.message}`
        };
    }
}

module.exports = { checkLoanEligibility, calculateCIBILScore };
