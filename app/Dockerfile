FROM --platform=linux/amd64 mcr.microsoft.com/playwright:next

# Set working directory
WORKDIR /home/pwuser/app

# Copy files
COPY --chown=pwuser . .

# Install dependencies
RUN npm install

RUN chown -R pwuser:pwuser /home/pwuser/app

USER pwuser

# Set entrypoint
ENTRYPOINT ["bash", "-c", "npm run start"]
