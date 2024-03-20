<a @click="downloadResume" class="btn btn-outlined btn-light btn-md mt-3">
  <span class="btn-text-container">
    <span class="btn-text-wrapper">Download my resumé</span>
    <span class="btn-text-wrapper">Download my resumé</span>
  </span>
  <div class="btn-bg rounded-pill"></div>
</a>
<script>
export default {
  name: 'DownloadResumeButton',
  props: {
    pdfUrl: {
      type: String,
      required: true
    },
    pdfFileName: {
      type: String,
      required: true
    }
  },
  methods: {
    downloadPdf() {
      // create element <a> for download PDF
      const link = document.createElement('a');
      link.href = this.pdfUrl;
      link.target = '_blank';
      link.download = this.pdfFileName;

      // Simulate a click on the element <a>
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
</script>