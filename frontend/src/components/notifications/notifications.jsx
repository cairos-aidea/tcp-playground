let notificationContainer = null;

function createContainer() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.bottom = '1.5rem';
        notificationContainer.style.right = '1.5rem';
        notificationContainer.style.zIndex = 9999;
        notificationContainer.style.display = 'flex';
        notificationContainer.style.flexDirection = 'column';
        notificationContainer.style.gap = '0.5rem';
        document.body.appendChild(notificationContainer);
    }
}

function showNotification(type, { id, title, message }) {
    createContainer();

    let colorClasses = '';
    let iconSvg = '';
    if (type === 'success') {
        colorClasses = 'text-green-800 bg-green-100 dark:bg-green-800 dark:text-green-200';
        iconSvg = `<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clip-rule="evenodd"></path>`;
    } else if (type === 'pending') {
        colorClasses = 'text-yellow-800 bg-yellow-100 dark:bg-yellow-800 dark:text-yellow-200';
        iconSvg = `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V7a1 1 0 112 0v2a1 1 0 01-2 0zm0 4a1 1 0 112 0 1 1 0 01-2 0z" clip-rule="evenodd"></path>`;
    } else {
        colorClasses = 'text-red-800 bg-red-100 dark:bg-red-800 dark:text-red-200';
        iconSvg = `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V7a1 1 0 112 0v2a1 1 0 01-2 0zm0 4a1 1 0 112 0 1 1 0 01-2 0z" clip-rule="evenodd"></path>`;
    }

    const notif = document.createElement('div');
    notif.className = `flex items-center p-4 mb-4 text-sm rounded-lg shadow transition-opacity duration-500 opacity-100 ${colorClasses}`;

    notif.innerHTML = `
        <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            ${iconSvg}
        </svg>
        <div class="flex flex-col mr-2">
            ${title ? `<span class="font-semibold">${title}</span>` : ''}
            <span>${message}</span>
        </div>
    `;

    notif.style.cursor = 'pointer';

    notif.onclick = () => {
        notif.style.opacity = 0;
        setTimeout(() => {
            if (notificationContainer.contains(notif)) {
                notificationContainer.removeChild(notif);
            }
        }, 500);
    };

    setTimeout(() => {
        notif.style.opacity = 0;
        setTimeout(() => {
            if (notificationContainer.contains(notif)) {
                notificationContainer.removeChild(notif);
            }
        }, 500);
    }, 5000);

    notificationContainer.appendChild(notif);
}

export function successNotification({ title, message }) {
    showNotification('success', { title, message });
}

export function errorNotification({ id, title, message }) {
    showNotification('error', { title, message });
}

export function pendingNotification({ id, title, message }) {
    showNotification('pending', { title, message });
}