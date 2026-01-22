import BaseField from './BaseField.js';
import { toSafePathName } from '../utils/stringUtils.js';
import { assetService } from '../../courseCreator/services/assetService.js';
import { Toast } from '../../courseCreator/components/Toast.js'; // Assuming Toast is available here or we use console/alert fallback

export default class ImageField extends BaseField {
    static get type() {
        return 'image';
    }

    render(container) {
        this.ensureLabel(container);
        this.ensureDescription(container);

        const wrapper = document.createElement('div');
        wrapper.className = "flex flex-col gap-2";

        // 1. Preview Area
        const previewContainer = document.createElement('div');
        previewContainer.className = "border rounded-md bg-gray-50 p-2 flex items-center justify-center min-h-[150px] relative overflow-hidden group";

        const imgMsg = document.createElement('span');
        imgMsg.className = "text-gray-400 text-sm italic";
        imgMsg.textContent = "No image selected";

        const img = document.createElement('img');
        img.className = "max-h-[200px] max-w-full object-contain shadow-sm hidden";

        // Check if value is object (localized) or string
        // This field currently supports SINGLE string value for simplicity, 
        // but if we need localized images, we'd need tabs. 
        // For now, let's assume global image for the step.
        const currentUrl = typeof this.value === 'string' ? this.value : (this.value?.url || '');

        if (currentUrl) {
            img.src = currentUrl;
            img.classList.remove('hidden');
            imgMsg.classList.add('hidden');
        }

        previewContainer.appendChild(imgMsg);
        previewContainer.appendChild(img);

        // 2. Controls Area
        const controls = document.createElement('div');
        controls.className = "flex gap-2";

        // Input (Text fallback)
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.value = currentUrl;
        urlInput.placeholder = "https://...";
        urlInput.className = "flex-1 border border-gray-300 rounded px-2 py-1 text-sm text-gray-600 focus:outline-none focus:border-blue-500";
        urlInput.onchange = (e) => this.handleUrlChange(e.target.value, img, imgMsg);

        // Browse Button
        const browseBtn = document.createElement('button');
        browseBtn.type = 'button';
        browseBtn.className = "bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded text-sm hover:bg-blue-200 transition";
        browseBtn.innerHTML = '<i class="fas fa-folder-open mr-1"></i> Browse';
        browseBtn.onclick = () => this.openAssetBrowser(urlInput, img, imgMsg);

        // Upload Button
        const uploadBtn = document.createElement('button');
        uploadBtn.type = 'button';
        uploadBtn.className = "bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded text-sm hover:bg-green-200 transition relative overflow-hidden";
        uploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt mr-1"></i> Upload';

        // Hidden File Input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.className = "absolute inset-0 opacity-0 cursor-pointer";
        fileInput.onchange = (e) => this.handleUpload(e, urlInput, img, imgMsg, uploadBtn);

        uploadBtn.appendChild(fileInput);

        controls.appendChild(urlInput);
        controls.appendChild(browseBtn);
        controls.appendChild(uploadBtn);

        wrapper.appendChild(previewContainer);
        wrapper.appendChild(controls);

        container.appendChild(wrapper);
    }

    handleUrlChange(url, img, msg) {
        this.value = url;
        this.onChange(url);
        if (url) {
            img.src = url;
            img.classList.remove('hidden');
            msg.classList.add('hidden');
        } else {
            img.classList.add('hidden');
            msg.classList.remove('hidden');
        }
    }

    async handleUpload(e, urlInput, img, msg, btn) {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input so chance triggers again
        e.target.value = '';

        const origText = btn.innerHTML;
        btn.innerText = '...';
        btn.disabled = true;

        try {
            // Context Validation
            const className = this.context?.className || this.context?.courseTitle; // Map Course Title to Class Name if needed
            const moduleName = this.context?.moduleName || this.context?.moduleTitle;

            if (!className || !moduleName) {
                console.error("Missing context for upload:", this.context);
                throw new Error("Missing Class Name or Module Name context for upload path. Please save the module first or check context.");
            }

            const safeClass = toSafePathName(className);
            const safeModule = toSafePathName(moduleName);

            const uploadPath = `classes/${safeClass}/modules/${safeModule}/`;
            console.log(`[ImageField] Uploading to: ${uploadPath}`);

            const url = await assetService.uploadFile(file, uploadPath);

            this.handleUrlChange(url, img, msg);
            urlInput.value = url;

            if (typeof Toast !== 'undefined') Toast.success("Image uploaded!");
        } catch (err) {
            console.error(err);
            if (typeof Toast !== 'undefined') Toast.error(err.message);
            else alert(err.message);
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    }

    async openAssetBrowser(urlInput, img, msg) {
        // We need a modal to show assets.
        // For now, let's create a simple ad-hoc modal and append to body.

        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm";

        const content = document.createElement('div');
        content.className = "bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]";

        // Header
        const header = document.createElement('div');
        header.className = "flex justify-between items-center p-4 border-b";
        header.innerHTML = '<h3 class="font-bold text-gray-800">Select Image</h3><button class="text-gray-400 hover:text-gray-600 close-btn text-xl">&times;</button>';
        content.appendChild(header);

        // List Container
        const list = document.createElement('div');
        list.className = "p-4 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto flex-1 bg-gray-50";
        list.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">Loading assets...</p>';
        content.appendChild(list);

        modal.appendChild(content);
        document.body.appendChild(modal);

        const close = () => modal.remove();
        header.querySelector('.close-btn').onclick = close;
        modal.onclick = (e) => { if (e.target === modal) close(); };

        // Fetch Assets
        try {
            const assets = await assetService.listAssets('course-assets'); // or generic uploads
            // Also fetch uploads folder
            const uploads = await assetService.listAssets('uploads');
            const allAssets = [...assets, ...uploads];

            list.innerHTML = '';
            if (allAssets.length === 0) {
                list.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No images found. Try uploading one!</p>';
            } else {
                allAssets.forEach(asset => {
                    const item = document.createElement('div');
                    item.className = "border rounded bg-white hover:ring-2 ring-blue-500 cursor-pointer transition overflow-hidden aspect-square flex flex-col group relative";
                    item.innerHTML = `
                    <div class="flex-1 flex items-center justify-center bg-gray-100 overflow-hidden relative">
                        <img src="${asset.url}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition"></div>
                    </div>
                    <div class="p-2 text-xs truncate bg-white text-gray-600 border-t" title="${asset.name}">${asset.name}</div>
                `;
                    item.onclick = () => {
                        this.handleUrlChange(asset.url, img, msg);
                        urlInput.value = asset.url;
                        close();
                    };
                    list.appendChild(item);
                });
            }
        } catch (err) {
            list.innerHTML = `<p class="text-red-500 col-span-full">Error loading assets: ${err.message}</p>`;
        }
    }
}
