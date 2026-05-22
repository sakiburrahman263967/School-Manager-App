/**
 * Madrasah ERP A4 PDF Printing & Export Engine
 * Generates beautiful, Islamic professional-grade layout documents
 * and triggers printing bound to the WebView and Android OS.
 */

const PDFExporter = {
    // 1. PRINT RECEIPT
    printReceipt: function(schoolId, receiptId) {
        const school = Storage.getSchools().find(s => s.id === schoolId);
        const fees = Storage.getSchoolData(schoolId, "fees");
        const receipt = fees.find(f => f.id === receiptId);
        
        if (!receipt) return alert("Receipt not found!");

        const students = Storage.getSchoolData(schoolId, "students");
        const student = students.find(s => s.id === receipt.studentId);
        if (!student) return alert("Student not found!");

        const originalContent = document.body.innerHTML;
        const printTitle = `Receipt_${receiptId}`;

        // Build premium Islamic-themed receipt layout
        const receiptHTML = `
            <div class="print-preview-container print-document" style="max-width: 790px; padding: 40px; margin: 0 auto; color: #1e293b; background: #ffffff;">
                <div class="print-receipt-border" style="border: 4px double #c5a059; padding: 30px; border-radius: 12px; position: relative;">
                    
                    <!-- Islamic Header -->
                    <div style="text-align: center; margin-bottom: 25px;">
                        <span style="font-size: 45px; display: block; margin-bottom: 8px;">🕌</span>
                        <h1 style="color: #1b5e20; font-family: 'Times New Roman', serif; font-size: 28px; font-weight: 800; letter-spacing: 1px; margin-bottom: 5px;">
                            ${school.name}
                        </h1>
                        <p style="color: #c5a059; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                            Monthly Fee Payment Official Receipt / রশিদ
                        </p>
                        <div class="ornament-line" style="margin: 15px 0;"></div>
                    </div>

                    <!-- Receipt Details Grid -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px;">
                        <div>
                            <div style="margin-bottom: 6px;"><strong>Receipt No:</strong> <code style="font-size:15px; color:#1b5e20;">${receipt.id}</code></div>
                            <div><strong>Session:</strong> ${receipt.academicSession}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="margin-bottom: 6px;"><strong>Date:</strong> ${Utils.formatDate(receipt.paymentDate || new Date())}</div>
                            <div><strong>Institution ID:</strong> ${schoolId}</div>
                        </div>
                    </div>

                    <!-- Student Biodata Block -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 30px; font-size: 14px;">
                        <h4 style="color: #1b5e20; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; font-weight: 700;">Student Particulars / শিক্ষার্থীর তথ্য</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px;">
                            <div>👤 <strong>Name:</strong> ${student.name}</div>
                            <div>📝 <strong>Roll Number:</strong> ${student.rollNumber}</div>
                            <div>📚 <strong>Class Level:</strong> ${student.class}</div>
                            <div>👥 <strong>Guardian Name:</strong> ${student.guardianName || '-'}</div>
                        </div>
                    </div>

                    <!-- Financial Ledger Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 14px;">
                        <thead>
                            <tr style="background-color: #1b5e20; color: #ffffff;">
                                <th style="padding: 12px 15px; text-align: left; border: 1px solid #103c14;">Fee Particular / ফি বিবরণ</th>
                                <th style="padding: 12px 15px; text-align: right; border: 1px solid #103c14; width: 140px;">Total Amount / মোট</th>
                                <th style="padding: 12px 15px; text-align: right; border: 1px solid #103c14; width: 140px;">Paid Amount / পরিশোধ</th>
                                <th style="padding: 12px 15px; text-align: right; border: 1px solid #103c14; width: 140px;">Dues Outstanding / বকেয়া</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 15px; border: 1px solid #e2e8f0; font-weight: 700;">${receipt.feeType}</td>
                                <td style="padding: 15px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${receipt.amountTotal.toLocaleString()} ৳</td>
                                <td style="padding: 15px; border: 1px solid #e2e8f0; text-align: right; color: #16a34a; font-weight: 800;">${receipt.amountPaid.toLocaleString()} ৳</td>
                                <td style="padding: 15px; border: 1px solid #e2e8f0; text-align: right; color: #dc2626; font-weight: 800;">${receipt.amountDue.toLocaleString()} ৳</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Seal Section -->
                    <div style="display: flex; justify-content: space-between; padding-top: 50px; font-size: 13.5px;">
                        <div style="text-align: center; width: 200px;">
                            <div style="border-top: 1px solid #cbd5e1; padding-top: 6px;">Registrar / কোষাধ্যক্ষ</div>
                        </div>
                        <div style="text-align: center; width: 220px; color: #1b5e20; font-family: 'Times New Roman', serif;">
                            <div style="font-size: 11px; margin-bottom: 4px; border: 1px dashed #c5a059; padding: 4px 10px; border-radius: 4px;">AL-BAYAN OFFICE SEAL</div>
                        </div>
                        <div style="text-align: center; width: 200px;">
                            <div style="border-top: 1px solid #cbd5e1; padding-top: 6px;">Institutional Head / অধ্যক্ষ</div>
                        </div>
                    </div>

                    <!-- Footer verse -->
                    <div style="text-align: center; margin-top: 50px; font-size: 12px; color: #64748b; font-style: italic; border-top: 1px solid #cbd5e1; padding-top: 15px;">
                        "Indeed, Allah commands you to render trusts to whom they are due..." (Quran, 4:58)
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;" class="no-print">
                <button class="btn btn-primary" onclick="window.print()">Print Document</button>
                <button class="btn btn-secondary" onclick="location.reload()">Back / ফিরে যান</button>
            </div>
        `;

        document.body.innerHTML = receiptHTML;

        // Perform layout print
        this.triggerNativePrint();

        // Restore content after short delay
        setTimeout(() => {
            document.body.innerHTML = originalContent;
            Router.render();
        }, 3000);
    },

    // 2. PRINT MARKSHEET
    printMarksheet: function(schoolId, resultId) {
        const school = Storage.getSchools().find(s => s.id === schoolId);
        const results = Storage.getSchoolData(schoolId, "results");
        const result = results.find(r => r.id === resultId);

        if (!result) return alert("Result report not found!");

        const students = Storage.getSchoolData(schoolId, "students");
        const student = students.find(s => s.id === result.studentId);
        if (!student) return alert("Student profile not found!");

        // Recalculate Class-wise automatic Merit Ranking dynamically
        const ranksMap = Utils.calculateMeritRanks(schoolId, result.class, result.examType, result.academicSession);
        const meritRankPosition = ranksMap[result.id] || "N/A";

        const originalContent = document.body.innerHTML;
        const evaluation = Utils.calculateOverallGPA(result.subjectMarks);

        // Build premium Golden Madrasah academic transcript
        const marksheetHTML = `
            <div class="print-preview-container print-document" style="max-width: 790px; padding: 45px; margin: 0 auto; color: #1e293b; background: #ffffff;">
                <div class="print-receipt-border" style="border: 6px double #c5a059; padding: 35px; border-radius: 12px; position: relative; background-color:#fafaf9;">
                    
                    <div class="islamic-pattern" style="opacity:0.02;"></div>

                    <!-- Islamic Header -->
                    <div style="text-align: center; margin-bottom: 25px;">
                        <span style="font-size: 50px; display: block; margin-bottom: 5px;">🕌</span>
                        <h1 style="color: #1b5e20; font-family: 'Georgia', serif; font-size: 30px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">
                            ${school.name}
                        </h1>
                        <p style="color: #c5a059; font-size: 14px; font-weight: 700; letter-spacing: 2px;">
                            ACADEMIC TRANSCRIPT & GRADUATION / পরীক্ষার নম্বরপত্র
                        </p>
                        <div class="ornament-line" style="margin: 15px 0;"></div>
                    </div>

                    <!-- Layout: Student Info left, Grade table on the right as reference -->
                    <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; font-size: 13.5px;">
                        <div style="flex: 1.5; background-color: #ffffff; border: 1px solid #c5a059; padding: 15px; border-radius: 8px;">
                            <h4 style="color: #1b5e20; margin-bottom: 8px; font-weight: 700; border-bottom: 1.5px solid var(--accent-gold); padding-bottom: 4px;">Student Particulars / ছাত্র বিবরণী</h4>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <div>👤 <strong>Student Name:</strong> ${student.name}</div>
                                <div>📝 <strong>Roll Number:</strong> ${student.rollNumber}</div>
                                <div>📚 <strong>Registered Class:</strong> ${student.class}</div>
                                <div>📆 <strong>Academic Term:</strong> ${result.examType} (${result.academicSession})</div>
                            </div>
                        </div>
                        <div style="flex: 1; font-size: 11px; background-color: #ffffff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
                            <h5 style="color: #1b5e20; text-align: center; margin-bottom: 6px; font-weight:700;">GRADING BAR / স্কেল</h5>
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <div style="display:flex; justify-content:space-between;"><span>80 - 100</span><strong>A+ (5.0)</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>70 - 79</span><strong>A (4.0)</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>60 - 69</span><strong>A- (3.5)</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>50 - 59</span><strong>B (3.0)</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>40 - 49</span><strong>C (2.0)</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>33 - 39</span><strong>D (1.0)</strong></div>
                                <div style="display:flex; justify-content:space-between; color:#ef4444;"><span>Below 33</span><strong>F (0.0)</strong></div>
                            </div>
                        </div>
                    </div>

                    <!-- Subject marks Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; background: #ffffff;">
                        <thead>
                            <tr style="background-color: #1b5e20; color: #ffffff;">
                                <th style="padding: 10px 15px; text-align: left; border: 1px solid #103c14;">Subject / বিষয়</th>
                                <th style="padding: 10px 15px; text-align: center; border: 1px solid #103c14; width: 100px;">Marks / নম্বর</th>
                                <th style="padding: 10px 15px; text-align: center; border: 1px solid #103c14; width: 120px;">Letter Grade</th>
                                <th style="padding: 10px 15px; text-align: center; border: 1px solid #103c14; width: 120px;">Grade Points</th>
                                <th style="padding: 10px 15px; text-align: left; border: 1px solid #103c14; width: 160px;">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(result.subjectMarks).map(subject => {
                                const marks = result.subjectMarks[subject];
                                const rule = Utils.calculateSubjectGPA(marks);
                                return `
                                    <tr>
                                        <td style="padding: 12px 15px; border: 1px solid #e2e8f0; font-weight: 700; color: #1b5e20;">${subject}</td>
                                        <td style="padding: 12px 15px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700;">${marks}</td>
                                        <td style="padding: 12px 15px; border: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: ${rule.grade === 'F' ? '#ef4444' : '#1e293b'}">${rule.grade}</td>
                                        <td style="padding: 12px 15px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700;">${rule.points.toFixed(2)}</td>
                                        <td style="padding: 12px 15px; border: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b;">${rule.remarks}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    <!-- Aggregate Summary Results cards and ranks -->
                    <div style="display: flex; gap: 20px; justify-content: space-between; margin-bottom: 40px;">
                        <div style="flex:1; text-align: center; padding: 15px; background: #e8f5e9; border: 2px solid #1b5e20; border-radius: 8px;">
                            <span style="font-size:11px; font-weight:700; color:#1b5e20; text-transform:uppercase;">Composite GPA / জিপিএ</span>
                            <div style="font-size: 28px; font-weight: 950; color:#1b5e20; margin-top: 5px;">${evaluation.gpa} / 5.0</div>
                        </div>
                        <div style="flex:1; text-align: center; padding: 15px; background: #fdf6e2; border: 2px solid #c5a059; border-radius: 8px;">
                            <span style="font-size:11px; font-weight:700; color:#b08d4b; text-transform:uppercase;">Overall Letter Grade</span>
                            <div style="font-size: 28px; font-weight: 950; color:#c5a059; margin-top: 5px;">${evaluation.grade}</div>
                        </div>
                        <div style="flex:1; text-align: center; padding: 15px; background: #e0f2fe; border: 2px solid #0284c7; border-radius: 8px;">
                            <span style="font-size:11px; font-weight:700; color:#0369a1; text-transform:uppercase;">Merit Rank / মেধা স্থান</span>
                            <div style="font-size: 28px; font-weight: 950; color:#0284c7; margin-top: 5px;">${meritRankPosition === 1 ? '🥇 1st' : meritRankPosition === 2 ? '🥈 2nd' : meritRankPosition === 3 ? '🥉 3rd' : meritRankPosition + ' Th'}</div>
                        </div>
                    </div>

                    <!-- Signature Rows -->
                    <div style="display: flex; justify-content: space-between; padding-top: 40px; font-size: 13px;">
                        <div style="text-align: center; width: 200px;">
                            <div style="border-top: 1px solid #cbd5e1; padding-top: 6px;">Class Teacher / শ্রেণি শিক্ষক</div>
                        </div>
                        <div style="text-align: center; width: 220px; font-style: italic; color: #1b5e20; font-family: 'Times New Roman', serif;">
                            <div style="border: 1.5px solid #c5a059; padding: 4px; border-radius: 4px; font-size: 10px; font-weight: 700;">ACADEMIC CERTIFIED OFFICE</div>
                        </div>
                        <div style="text-align: center; width: 200px;">
                            <div style="border-top: 1px solid #cbd5e1; padding-top: 6px;">Exams Registrar / পরীক্ষা নিয়ন্ত্রক</div>
                        </div>
                    </div>

                    <!-- Arabic Verse -->
                    <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #64748b; font-style: italic; border-top: 1px solid #cbd5e1; padding-top: 15px;">
                        "He who travels to seek knowledge, Allah will facilitate for him a path to Paradise." (Muslim 2699)
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;" class="no-print">
                <button class="btn btn-primary" onclick="window.print()">Print Transcript</button>
                <button class="btn btn-secondary" onclick="location.reload()">Back / ফিরে যান</button>
            </div>
        `;

        document.body.innerHTML = marksheetHTML;

        // Trigger Android print bound
        this.triggerNativePrint();

        // Restore content after short delay
        setTimeout(() => {
            document.body.innerHTML = originalContent;
            Router.render();
        }, 3000);
    },

    // Safely trigger Android JavascriptInterface printing if accessible, otherwise fallback to web Print
    triggerNativePrint: function() {
        if (typeof window.AndroidPrint !== "undefined" && window.AndroidPrint.printPage) {
            window.AndroidPrint.printPage();
        } else {
            console.log("No native Android print channels, trying web browser print().");
        }
    }
};
