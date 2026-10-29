import {
  Callout,
  Card,
  ChannelSelect,
  Field,
  NumberInput,
  RoleMultiSelect,
  Section,
  TextInput,
  Toggle,
} from "../components/ui.jsx";

export function AccessSection({ config, update, server }) {
  const labels = config.labels;
  return (
    <Section
      eyebrow="Permissions & flow"
      title="Access, timing & buttons"
      description="Decide who can see tickets, who can claim them, and how every delay feels."
    >
      <div className="grid two">
        <Card
          title="Team roles"
          description="These are global. You can add extra roles per ticket type."
        >
          <div className="form-grid">
            <Field label="Admin roles" hint="Can see every ticket and every answers channel." wide>
              <RoleMultiSelect
                values={config.permissions.adminRoleIds}
                onChange={(value) =>
                  update(["permissions", "adminRoleIds"], value)
                }
                server={server}
              />
            </Field>
            <Field
              label="Staff roles"
              hint="Can see classic tickets and claim any ticket they are notified about."
              wide
            >
              <RoleMultiSelect
                values={config.permissions.staffRoleIds}
                onChange={(value) =>
                  update(["permissions", "staffRoleIds"], value)
                }
                server={server}
              />
            </Field>
          </div>
          <Callout tone="info" title="Ticket visibility">
            Classic tickets: owner + staff + admins. Question tickets: owner +
            admins only, until a staff member claims. Answers channels: admins and
            the guild owner only.
          </Callout>
        </Card>

        <Card title="Defaults" description="Used whenever a ticket type leaves a field empty.">
          <div className="form-grid">
            <Field label="Category" wide>
              <ChannelSelect
                value={config.defaults.categoryId}
                onChange={(value) => update(["defaults", "categoryId"], value)}
                server={server}
                categoriesOnly
              />
            </Field>
            <Field label="Support channel" wide>
              <ChannelSelect
                value={config.defaults.supportChannelId}
                onChange={(value) =>
                  update(["defaults", "supportChannelId"], value)
                }
                server={server}
              />
            </Field>
            <Field
              label="Ticket channel name"
              hint="{username}, {type}, {userId} are available."
              wide
            >
              <TextInput
                value={config.defaults.ticketNameFormat}
                onChange={(value) =>
                  update(["defaults", "ticketNameFormat"], value)
                }
                placeholder="ticket-{username}"
                maxLength={100}
              />
            </Field>
            <Field
              label="Answers channel name"
              hint="{ticket} becomes the ticket channel name. Default: answers-{ticket}."
              wide
            >
              <TextInput
                value={config.defaults.answersNameFormat}
                onChange={(value) =>
                  update(["defaults", "answersNameFormat"], value)
                }
                placeholder="answers-{ticket}"
                maxLength={100}
              />
            </Field>
          </div>
        </Card>
      </div>

      <Card
        title="Behavior"
        description="Small decisions that change how the whole ticket system feels."
      >
        <div className="toggle-grid">
          <Toggle
            label="One open ticket per type"
            hint="Stops the same user opening duplicates."
            checked={config.behavior.oneOpenPerType}
            onChange={(value) =>
              update(["behavior", "oneOpenPerType"], value)
            }
          />
          <Toggle
            label="Allow users to close"
            hint="Staff and admins can always close."
            checked={config.behavior.allowUserClose}
            onChange={(value) =>
              update(["behavior", "allowUserClose"], value)
            }
          />
          <Toggle
            label="Ping the owner on claim"
            hint="Sends a single mention when a ticket is claimed."
            checked={config.behavior.pingOwnerOnClaim}
            onChange={(value) =>
              update(["behavior", "pingOwnerOnClaim"], value)
            }
          />
          <Toggle
            label="Ping staff role on new ticket"
            hint="Adds a role mention above the staff notification."
            checked={config.behavior.notifyStaff}
            onChange={(value) => update(["behavior", "notifyStaff"], value)}
          />
          <Toggle
            label="Delete ticket channel on close"
            hint="Answers channels are never deleted."
            checked={config.behavior.deleteOnClose}
            onChange={(value) => update(["behavior", "deleteOnClose"], value)}
          />
        </div>
        <div className="form-grid compact-grid">
          <Field label="Max answer length" hint="Characters per answer.">
            <NumberInput
              value={config.behavior.maxAnswerLength}
              onChange={(value) =>
                update(["behavior", "maxAnswerLength"], value)
              }
              min={10}
              max={2000}
            />
          </Field>
          <Field label="Delete delay" hint="After closing the ticket.">
            <NumberInput
              value={config.timing.closeDelaySeconds}
              onChange={(value) =>
                update(["timing", "closeDelaySeconds"], value)
              }
              min={0}
              max={60}
              suffix="sec"
            />
          </Field>
        </div>
      </Card>

      <div className="grid two">
        <Card
          title="Loading timings"
          description="The short animations that make Ply feel alive."
        >
          <div className="form-grid">
            <Field label="Ticket preparation" hint="Between these two values." wide>
              <div className="range-pair">
                <NumberInput
                  value={config.timing.prepMinSeconds}
                  onChange={(value) =>
                    update(["timing", "prepMinSeconds"], value)
                  }
                  min={0}
                  max={120}
                  suffix="s"
                />
                <span>to</span>
                <NumberInput
                  value={config.timing.prepMaxSeconds}
                  onChange={(value) =>
                    update(["timing", "prepMaxSeconds"], value)
                  }
                  min={0}
                  max={120}
                  suffix="s"
                />
              </div>
            </Field>
            <Field label="Saving an answer" hint="1–3 seconds recommended." wide>
              <div className="range-pair">
                <NumberInput
                  value={config.timing.saveMinSeconds}
                  onChange={(value) =>
                    update(["timing", "saveMinSeconds"], value)
                  }
                  min={0}
                  max={30}
                  suffix="s"
                />
                <span>to</span>
                <NumberInput
                  value={config.timing.saveMaxSeconds}
                  onChange={(value) =>
                    update(["timing", "saveMaxSeconds"], value)
                  }
                  min={0}
                  max={30}
                  suffix="s"
                />
              </div>
            </Field>
            <Field label="Claimed → spinner" hint="How long the claimed embed stays visible." wide>
              <NumberInput
                value={config.timing.claimedToSpinnerMs}
                onChange={(value) =>
                  update(["timing", "claimedToSpinnerMs"], value)
                }
                min={0}
                max={30000}
                step={100}
                suffix="ms"
              />
            </Field>
            <Field label="Gap before next question" wide>
              <NumberInput
                value={config.timing.nextQuestionMs}
                onChange={(value) =>
                  update(["timing", "nextQuestionMs"], value)
                }
                min={0}
                max={10000}
                step={100}
                suffix="ms"
              />
            </Field>
          </div>
        </Card>

        <Card
          title="Button labels"
          description="Every button can speak in your server's voice."
        >
          <div className="form-grid">
            <Field label="Claim button">
              <TextInput
                value={labels.claim}
                onChange={(value) => update(["labels", "claim"], value)}
                maxLength={80}
              />
            </Field>
            <Field label="Claimed state">
              <TextInput
                value={labels.claimed}
                onChange={(value) => update(["labels", "claimed"], value)}
                maxLength={80}
              />
            </Field>
            <Field label="Close button">
              <TextInput
                value={labels.close}
                onChange={(value) => update(["labels", "close"], value)}
                maxLength={80}
              />
            </Field>
            <Field label="Confirm close">
              <TextInput
                value={labels.confirmClose}
                onChange={(value) => update(["labels", "confirmClose"], value)}
                maxLength={80}
              />
            </Field>
            <Field label="Cancel">
              <TextInput
                value={labels.cancel}
                onChange={(value) => update(["labels", "cancel"], value)}
                maxLength={80}
              />
            </Field>
            <Field label="Send answers">
              <TextInput
                value={labels.send}
                onChange={(value) => update(["labels", "send"], value)}
                maxLength={80}
              />
            </Field>
            <Field label="Skip word">
              <TextInput
                value={labels.skip}
                onChange={(value) => update(["labels", "skip"], value)}
                maxLength={80}
              />
            </Field>
            <Field label="Dropdown placeholder">
              <TextInput
                value={labels.selectPlaceholder}
                onChange={(value) =>
                  update(["labels", "selectPlaceholder"], value)
                }
                maxLength={100}
              />
            </Field>
          </div>
        </Card>
      </div>
    </Section>
  );
}
