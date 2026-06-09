/**
 * Quick Workflow Verification Utility
 * Users can run this in browser console to test the complete workflow
 */

window.workflowTester = {
  /**
   * Run all workflow tests
   */
  runAll: async function() {
    console.clear()
    console.log('🚀 Starting Complete Workflow Test Suite...')
    console.log('=' .repeat(60))
    
    const { testCompleteWorkflow } = await import('/src/utils/workflowTests.js')
    
    // Get current user data
    const auth = JSON.parse(localStorage.getItem('auth') || '{}')
    const userId = auth?.id || localStorage.getItem('userId')
    
    const testConfig = {
      staffId: userId,
      department: auth?.department,
      staffSignature: auth?.eSignature,
      hodSignature: auth?.eSignature,
      hodName: auth?.name,
      marksheetId: null // Will be filled from first marksheet
    }
    
    // Get a marksheet ID if available
    try {
      const response = await fetch('/api/marksheets?limit=1')
      const data = await response.json()
      if (data.marksheets && data.marksheets.length > 0) {
        testConfig.marksheetId = data.marksheets[0]._id
      }
    } catch (e) {
      console.warn('Could not fetch sample marksheet')
    }
    
    const results = await testCompleteWorkflow(testConfig)
    
    console.log('')
    console.log('📋 TEST RESULTS SUMMARY:')
    console.log('=' .repeat(60))
    console.log(`Total Tests: ${results.summary.total}`)
    console.log(`✅ Passed: ${results.summary.passed}`)
    console.log(`❌ Failed: ${results.summary.failed}`)
    console.log('')
    
    console.table(results.tests)
    
    return results
  },

  /**
   * Test signature upload: Remove white background
   */
  testSignatureProcessing: async function() {
    console.log('🔍 Testing Signature White Background Removal...')
    
    const { processSignatureImage } = await import('/src/utils/signatureProcessor.js')
    
    // Create a test image: black signature on white background
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    
    // Draw white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw black signature (simple S shape)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    ctx.beginPath()
    ctx.arc(80, 60, 20, 0, Math.PI, true)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(80, 40, 20, 0, Math.PI, false)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(100, 30)
    ctx.quadraticCurveTo(120, 50, 100, 70)
    ctx.stroke()
    
    const testImage = canvas.toDataURL('image/png')
    
    try {
      const processed = await processSignatureImage(testImage)
      console.log('✅ Signature processing successful')
      console.log('Original size:', testImage.length, 'bytes')
      console.log('Processed size:', processed.length, 'bytes')
      console.log('Compression ratio:', (1 - processed.length / testImage.length) * 100, '%')
      
      // Show the result
      const img = document.createElement('img')
      img.src = processed
      img.style.border = '1px solid #000'
      img.style.maxWidth = '400px'
      console.log('Image displayed above (opens in new tab if you right-click and inspect)')
      
      return { success: true, original: testImage, processed }
    } catch (error) {
      console.error('❌ Signature processing failed:', error.message)
      return { success: false, error: error.message }
    }
  },

  /**
   * Test import workflow
   */
  testImportOnly: async function() {
    console.log('🔍 Testing Import Workflow...')
    const { testImportWorkflow } = await import('/src/utils/workflowTests.js')
    const result = await testImportWorkflow()
    console.table(result)
    return result
  },

  /**
   * Test staff verification workflow
   */
  testStaffVerifyOnly: async function(marksheetId) {
    console.log('🔍 Testing Staff Verification Workflow...')
    const { testStaffVerifyWorkflow } = await import('/src/utils/workflowTests.js')
    const auth = JSON.parse(localStorage.getItem('auth') || '{}')
    const result = await testStaffVerifyWorkflow(marksheetId, auth?.eSignature)
    console.table(result)
    return result
  },

  /**
   * Test HOD verification workflow
   */
  testHODVerifyOnly: async function(marksheetId) {
    console.log('🔍 Testing HOD Verification Workflow...')
    const { testHODVerifyWorkflow } = await import('/src/utils/workflowTests.js')
    const auth = JSON.parse(localStorage.getItem('auth') || '{}')
    const result = await testHODVerifyWorkflow(marksheetId, auth?.eSignature, auth?.name)
    console.table(result)
    return result
  },

  /**
   * Test dispatch workflow
   */
  testDispatchOnly: async function(marksheetId) {
    console.log('🔍 Testing Dispatch Workflow...')
    const { testDispatchWorkflow } = await import('/src/utils/workflowTests.js')
    const result = await testDispatchWorkflow([marksheetId])
    console.table(result)
    return result
  },

  /**
   * Test PDF generation
   */
  testPDFOnly: async function(marksheetId) {
    console.log('🔍 Testing PDF Generation Workflow...')
    const { testPDFGenerationWorkflow } = await import('/src/utils/workflowTests.js')
    const result = await testPDFGenerationWorkflow(marksheetId)
    console.table(result)
    return result
  },

  /**
   * Show user configuration
   */
  showConfig: function() {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}')
    console.log('Current User Configuration:')
    console.table({
      'User ID': auth?.id || auth?._id || 'NOT SET',
      'Name': auth?.name || 'NOT SET',
      'Email': auth?.email || 'NOT SET',
      'Role': auth?.role || 'NOT SET',
      'Department': auth?.department || 'NOT SET',
      'Has Signature': !!auth?.eSignature,
      'Signature Size': auth?.eSignature ? auth.eSignature.length + ' bytes' : 'N/A',
      'Last Updated': auth?.updatedAt || 'N/A'
    })
  },

  /**
   * Get help/instructions
   */
  help: function() {
    console.clear()
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║          WORKFLOW TESTER - CONSOLE COMMANDS REFERENCE             ║
╚══════════════════════════════════════════════════════════════════╝

🚀 RUN ALL TESTS:
   workflowTester.runAll()

🧪 RUN INDIVIDUAL TESTS:
   workflowTester.testImportOnly()
   workflowTester.testStaffVerifyOnly(marksheetId)
   workflowTester.testHODVerifyOnly(marksheetId)
   workflowTester.testDispatchOnly(marksheetId)
   workflowTester.testPDFOnly(marksheetId)
   workflowTester.testSignatureProcessing()

⚙️  UTILITIES:
   workflowTester.showConfig()      - Show current user configuration
   workflowTester.help()             - Display this help menu

📝 WORKFLOW STAGES:
   1. Import - Upload Excel file with marks
   2. Staff Verify - Staff reviews and adds signature
   3. HOD Verify - HOD reviews and adds signature
   4. Dispatch - Send marksheet PDFs to students
   5. PDF - Generate and download PDF with signatures

💡 TIPS:
   - Make sure you've uploaded a signature in Settings
   - All signatures should be black on white background
   - Check browser console for detailed error messages
   - Tests will show detailed pass/fail status

🔗 DOCUMENTATION:
   See WORKFLOW_GUIDE.md for complete workflow documentation
    `)
  }
}

console.log('✅ Workflow Tester loaded! Type: workflowTester.help()')
